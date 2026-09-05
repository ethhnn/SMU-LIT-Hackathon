import { z } from "zod";

import { getCatalogTool, TOOL_CATALOG, type ToolId } from "@/lib/catalog";
import type { QuestionHistoryMessage } from "@/lib/contracts";
import type { DynamicScreenshotScene } from "@/lib/dynamic-scene";
import { getOpenRouterClient, getRecommendationModel } from "@/lib/openrouter";
import type { Highlight } from "@/lib/openlaw-workflow";
import {
  getScreenshotAsset,
  getScreenshotKeywordIndex,
  getScreenshotsForTools,
  getThumbnailDataUrl,
  type ScreenshotAsset,
} from "@/lib/screenshot-library";
import type { ScreenshotGuide } from "@/lib/support-topics";

type ScreenshotAssistantInput = {
  scenario: string;
  toolIds: ToolId[];
  question: string;
  history: QuestionHistoryMessage[];
};

type ScreenshotAssistantResult = {
  answer: string;
  guide?: ScreenshotGuide;
  scene?: DynamicScreenshotScene;
  resolvedToolIds: ToolId[];
};

const candidateSchema = z.object({
  screenshotIds: z.array(z.string()).max(6),
});

const normalizedHighlightSchema = z.preprocess((value) => {
  if (typeof value === "string") {
    const values = value.split(/[,\s]+/).map(Number);
    if (values.length === 4 && values.every(Number.isFinite)) {
      return { x: values[0], y: values[1], width: values[2], height: values[3] };
    }
  }
  if (Array.isArray(value) && value.length === 4) {
    return { x: value[0], y: value[1], width: value[2], height: value[3] };
  }
  return value;
}, z.object({
  x: z.number().min(0).max(1_000),
  y: z.number().min(0).max(1_000),
  width: z.number().positive().max(1_000),
  height: z.number().positive().max(1_000),
}));

const highlightDecisionSchema = z.object({
  highlight: normalizedHighlightSchema,
});

const visualDecisionSchema = z.object({
  answer: z.string().trim().min(1).max(2_000).nullable().optional(),
  imageCanAnswer: z.boolean(),
  screenshotId: z.string().trim().min(1).nullable(),
  title: z.string().trim().min(1).max(120).nullable(),
  instruction: z.string().trim().min(1).max(600).nullable(),
  expectedResult: z.string().trim().min(1).max(400).nullable(),
  caption: z.string().trim().min(1).max(400).nullable(),
  highlight: normalizedHighlightSchema.nullable(),
});

const conversationText = (history: QuestionHistoryMessage[]): string =>
  history.map((message) => `${message.role}: ${message.content}`).join("\n") ||
  "No previous turns.";

const candidateFallback = (
  assets: readonly ScreenshotAsset[],
  input: ScreenshotAssistantInput,
): ScreenshotAsset[] => {
  const terms = new Set(
    `${input.scenario} ${conversationText(input.history)} ${input.question}`
      .toLowerCase()
      .match(/[a-z0-9]+/g) || [],
  );
  return [...assets]
    .map((asset, index) => ({
      asset,
      index,
      score: asset.keywords.filter(
        (keyword) => keyword.length > 2 && terms.has(keyword),
      ).length,
    }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, 6)
    .map(({ asset }) => asset);
};

const shortlistScreenshots = async (
  assets: readonly ScreenshotAsset[],
  input: ScreenshotAssistantInput,
): Promise<ScreenshotAsset[]> => {
  if (assets.length <= 6) {
    return [...assets];
  }

  const client = getOpenRouterClient();
  if (!client) {
    return candidateFallback(assets, input);
  }

  try {
    const response = await client.chat.completions.create({
      model: getRecommendationModel(),
      temperature: 0,
      max_tokens: 220,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Select up to six screenshot IDs that are most likely to help answer the current software-training question. " +
            "Use the human-reviewed website and reference description in the complete screenshot index, plus the scenario and recent conversation. " +
            "Treat the reference description as authoritative for page identity, visible controls, filters, and captured state. " +
            "Follow-up questions may refer to the first or latest earlier answer. " +
            "Return only JSON with screenshotIds. Do not answer the question and do not invent IDs.",
        },
        {
          role: "user",
          content: `Training objective:\n${input.scenario}\n\nRecent conversation:\n${conversationText(input.history)}\n\nCurrent question:\n${input.question}\n\nComplete screenshot keyword index:\n${getScreenshotKeywordIndex(assets)}`,
        },
      ],
    });
    const raw = response.choices[0]?.message.content;
    const parsed = raw ? candidateSchema.safeParse(JSON.parse(raw)) : undefined;
    if (!parsed?.success) {
      return candidateFallback(assets, input);
    }
    const selected = parsed.data.screenshotIds.flatMap((id) => {
      const asset = getScreenshotAsset(id);
      return asset && assets.some((candidate) => candidate.id === id)
        ? [asset]
        : [];
    });
    return selected.length > 0 ? selected : candidateFallback(assets, input);
  } catch {
    return candidateFallback(assets, input);
  }
};

const toHighlight = (
  asset: ScreenshotAsset,
  normalized: z.infer<typeof normalizedHighlightSchema>,
): Highlight => {
  const coordinateScale = Math.max(
    normalized.x,
    normalized.y,
    normalized.width,
    normalized.height,
  ) > 1
    ? 1_000
    : 1;
  const x = Math.min(normalized.x / coordinateScale, 0.98);
  const y = Math.min(normalized.y / coordinateScale, 0.98);
  const width = Math.min(normalized.width / coordinateScale, 1 - x);
  const height = Math.min(normalized.height / coordinateScale, 1 - y);
  return {
    x: Math.round(x * asset.width),
    y: Math.round(y * asset.height),
    width: Math.max(8, Math.round(width * asset.width)),
    height: Math.max(8, Math.round(height * asset.height)),
  };
};

const refineHighlight = async ({
  asset,
  question,
  title,
  instruction,
  referenceDescription,
  fallback,
}: {
  asset: ScreenshotAsset;
  question: string;
  title: string;
  instruction: string;
  referenceDescription: string;
  fallback: z.infer<typeof normalizedHighlightSchema>;
}): Promise<z.infer<typeof normalizedHighlightSchema>> => {
  const client = getOpenRouterClient();
  if (!client) {
    return fallback;
  }

  try {
    const response = await client.chat.completions.create({
      model: getRecommendationModel(),
      temperature: 0,
      max_tokens: 160,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Locate the one visible interface control or content region that supports the training instruction. " +
            "Return only JSON with highlight containing x, y, width, and height on a 0-to-1000 coordinate grid. " +
            "Make the rectangle tight around the one clickable target; do not frame the whole page, the main content area, unrelated results, or decorative content.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Current question: ${question}\nScreenshot title: ${title}\nInstruction: ${instruction}\nHuman-reviewed reference: ${referenceDescription}\nScreenshot ID: ${asset.id}`,
            },
            {
              type: "image_url",
              image_url: {
                url: getThumbnailDataUrl(asset),
                detail: "high",
              },
            },
          ],
        },
      ],
    });
    const raw = response.choices[0]?.message.content;
    const parsed = raw
      ? highlightDecisionSchema.safeParse(JSON.parse(raw))
      : undefined;
    return parsed?.success ? parsed.data.highlight : fallback;
  } catch {
    return fallback;
  }
};

export const answerWithScreenshotLibrary = async (
  input: ScreenshotAssistantInput,
): Promise<ScreenshotAssistantResult> => {
  const candidateTools = input.toolIds.flatMap((toolId) => {
    const tool = getCatalogTool(toolId);
    return tool ? [tool] : [];
  });
  const effectiveTools = candidateTools.length > 0 ? candidateTools : [...TOOL_CATALOG];
  const effectiveToolIds = effectiveTools.map((tool) => tool.id);
  const assets = getScreenshotsForTools(effectiveToolIds);
  const candidates = await shortlistScreenshots(assets, {
    ...input,
    toolIds: effectiveToolIds,
  });
  const client = getOpenRouterClient();

  if (!client) {
    return {
      answer:
        "The screenshot library is available, but OpenRouter is not configured to interpret this question. Add the API key and retry.",
      resolvedToolIds: effectiveToolIds,
    };
  }

  const toolRoles = effectiveTools
    .map((tool) => `${tool.id}: ${tool.name} — ${tool.intendedUse}`)
    .join("\n");
  const content: Array<
    | { type: "text"; text: string }
    | {
        type: "image_url";
        image_url: { url: string; detail: "low" };
      }
  > = [
    {
      type: "text",
      text:
        `Training objective:\n${input.scenario}\n\nCandidate tool roles:\n${toolRoles}\n\nRecent conversation (use this to resolve references to earlier questions):\n${conversationText(input.history)}\n\nCurrent question (answer this question, not an earlier one):\n${input.question}\n\n` +
        "The candidate screenshots follow. Each label immediately precedes its image.",
    },
  ];
  for (const asset of candidates) {
    content.push({
      type: "text",
      text:
        `Screenshot ID: ${asset.id}\n` +
        `Website/product: ${asset.website}\n` +
        `Human-reviewed screenshot reference: ${asset.referenceDescription}\n` +
        `Shared controls for this website family: ${asset.sharedControls}\n` +
        `Search keywords: ${asset.keywords.join(", ")}`,
    });
    content.push({
      type: "image_url",
      image_url: { url: getThumbnailDataUrl(asset), detail: "low" },
    });
  }

  try {
    const response = await client.chat.completions.create({
      model: getRecommendationModel(),
      temperature: 0.1,
      max_tokens: 650,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a software-training tutor with vision. Return only JSON with answer, imageCanAnswer, screenshotId, title, instruction, expectedResult, caption, and highlight. " +
            "Answer the current question directly. Use recent conversation to resolve pronouns and references, but do not repeat an earlier answer when the current question changed. " +
            "Each candidate has human-reviewed reference metadata. Treat that metadata as authoritative for website identity, visible control names, filters, options, and expanded or selected state; use the image to confirm position and visual context. " +
            "Inspect every candidate image. If exactly one supplied image materially helps, set imageCanAnswer true, use its exact ID, and provide a tight 0-to-1000 highlight rectangle around only the relevant visible control or content. " +
            "Write a concrete instruction naming the exact visible control and action; avoid generic wording such as explore, visit the website, or use the search. Write expectedResult and caption only from what is actually visible. If no image helps, set imageCanAnswer false and all image fields to null. " +
            "Never invent a control missing from the reference and image, an unseen click result, legal conclusion, or cross-tool handoff. State when guidance is based only on a supplied screenshot.",
        },
        { role: "user", content },
      ],
    });
    const raw = response.choices[0]?.message.content;
    if (!raw) {
      throw new Error("OpenRouter returned no contextual answer.");
    }
    const rawDecision = JSON.parse(raw);
    const parsedDecision = visualDecisionSchema.safeParse(rawDecision);
    if (!parsedDecision.success) {
      console.error("Invalid screenshot decision", rawDecision);
      throw parsedDecision.error;
    }
    const decision = parsedDecision.data;
    const answer = decision.answer || decision.instruction;
    if (!answer) {
      throw new Error("OpenRouter returned no direct answer.");
    }
    const asset = decision.imageCanAnswer
      ? candidates.find((candidate) => candidate.id === decision.screenshotId)
      : undefined;
    if (
      !asset ||
      !decision.title ||
      !decision.instruction ||
      !decision.expectedResult ||
      !decision.caption ||
      !decision.highlight
    ) {
      return {
        answer,
        resolvedToolIds: effectiveToolIds,
      };
    }

    const tool = getCatalogTool(asset.toolId);
    const normalizedHighlight = await refineHighlight({
      asset,
      question: input.question,
      title: decision.title,
      instruction: decision.instruction,
      referenceDescription: asset.referenceDescription,
      fallback: decision.highlight,
    });
    const highlight = toHighlight(asset, normalizedHighlight);
    const guide: ScreenshotGuide = {
      id: `${asset.id}-guide`,
      toolId: asset.toolId,
      toolName: tool?.name || asset.toolId,
      title: decision.title,
      instruction: decision.instruction,
      expectedResult: decision.expectedResult,
      screenshot: asset.originalUrl,
      sourceWidth: asset.width,
      sourceHeight: asset.height,
      highlight,
      caption: decision.caption,
      evidenceStatus: "screenshot-observation",
    };
    return {
      answer,
      guide,
      scene: {
        screenshotAssetId: asset.id,
        toolId: asset.toolId,
        toolName: guide.toolName,
        title: guide.title,
        instruction: guide.instruction,
        expectedResult: guide.expectedResult,
        caption: guide.caption,
        highlight,
      },
      resolvedToolIds: [asset.toolId],
    };
  } catch (error) {
    console.error("Screenshot-assisted answer failed", error);
    return {
      answer:
        "I could not interpret the supplied screenshots for this question. Please retry; video coverage is unavailable until a matching image is confirmed.",
      resolvedToolIds: effectiveToolIds,
    };
  }
};
