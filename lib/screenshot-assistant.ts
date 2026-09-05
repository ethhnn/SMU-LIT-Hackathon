import { z } from "zod";

import { getCatalogTool, TOOL_CATALOG, type ToolId } from "@/lib/catalog";
import type { QuestionHistoryMessage } from "@/lib/contracts";
import type { DynamicScreenshotScene } from "@/lib/dynamic-scene";
import { getOpenRouterClient, getRecommendationModel } from "@/lib/openrouter";
import type { Highlight } from "@/lib/openlaw-workflow";
import {
  followsConfirmedScreenshotPaths,
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
  priorScreenshotIds?: string[];
  requireEntryScene?: boolean;
};

export type ScreenshotAssistantResult = {
  answer: string;
  guides: ScreenshotGuide[];
  scenes: DynamicScreenshotScene[];
  resolvedToolIds: ToolId[];
};

const candidateSchema = z.object({
  screenshotIds: z.array(z.string()).max(18),
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

const highlightLocatorSchema = z.object({
  targetVisible: z.boolean(),
  targetDescription: z.string().trim().min(1).max(240),
  confidence: z.number().min(0).max(1),
  highlight: normalizedHighlightSchema.nullable(),
});

const highlightValidationSchema = z.object({
  confirmed: z.boolean(),
  confidence: z.number().min(0).max(1),
  reason: z.string().trim().min(1).max(600),
  correctedHighlight: normalizedHighlightSchema.nullable().optional(),
});

const visualStepSchema = z.object({
  screenshotId: z.string().trim().min(1).nullable(),
  title: z.string().trim().min(1).max(120).nullable(),
  instruction: z.string().trim().min(1).max(600).nullable(),
  expectedResult: z.string().trim().min(1).max(400).nullable(),
  caption: z.string().trim().min(1).max(400).nullable(),
  highlightTarget: z.string().trim().min(1).max(240).nullable().optional(),
  highlight: z.unknown().nullable().optional(),
});

const visualDecisionSchema = z.object({
  answer: z.string().trim().min(1).max(4_000).nullable().optional(),
  imageCanAnswer: z.boolean(),
  steps: z.array(visualStepSchema).max(9),
});

const conversationText = (history: QuestionHistoryMessage[]): string =>
  history.map((message) => `${message.role}: ${message.content}`).join("\n") ||
  "No previous turns.";

const isConnectionFailure = (error: unknown): boolean => {
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current; depth += 1) {
    if (current instanceof Error) {
      const message = `${current.name} ${current.message}`.toLowerCase();
      if (
        message.includes("connection") ||
        message.includes("fetch") ||
        message.includes("eacces") ||
        message.includes("network")
      ) {
        return true;
      }
      current = current.cause;
      continue;
    }
    break;
  }
  return false;
};

const isEntryAsset = (asset: ScreenshotAsset): boolean => {
  const identity = `${asset.id} ${asset.filename} ${asset.label}`;
  const isNamedEntry =
    /\bhome\s?page\b|\bhomepage\b|\blanding page\b/i.test(identity) ||
    /^(baseline|initial|entry)\b/i.test(asset.referenceDescription);
  return isNamedEntry && asset.transitions.length > 0;
};

const retrievalStopwords = new Set([
  "about", "addition", "also", "and", "are", "behind", "could", "from",
  "have", "into", "like", "more", "other", "research", "that",
  "the", "their", "them", "these", "this", "through", "use", "what", "when",
  "where", "which", "with", "would", "your",
]);

const candidateFallback = (
  assets: readonly ScreenshotAsset[],
  input: ScreenshotAssistantInput,
): ScreenshotAsset[] => {
  const termsOf = (value: string): string[] =>
    value.toLowerCase().match(/[a-z0-9]+/g) || [];
  const usefulTermsOf = (value: string): string[] =>
    termsOf(value).filter(
      (term) => term.length > 2 && !retrievalStopwords.has(term),
    );
  const currentTerms = new Set(usefulTermsOf(input.question));
  const scenarioTerms = new Set(usefulTermsOf(input.scenario));
  const historyTerms = new Set(usefulTermsOf(conversationText(input.history)));
  const meaningfulCurrentTerms = termsOf(input.question).filter(
    (term) => term.length > 2,
  );
  const currentPhrases = meaningfulCurrentTerms
    .slice(0, -1)
    .map((term, index) => `${term} ${meaningfulCurrentTerms[index + 1]}`);
  const priorIds = new Set(input.priorScreenshotIds || []);

  return [...assets]
    .map((asset, index) => {
      const pageText = `${asset.label} ${asset.website} ${asset.referenceDescription}`.toLowerCase();
      const weightedTerms = asset.keywords.reduce((score, keyword) => {
        if (keyword.length <= 2 || retrievalStopwords.has(keyword)) return score;
        return (
          score +
          (currentTerms.has(keyword) ? 8 : 0) +
          (scenarioTerms.has(keyword) ? 2 : 0) +
          (historyTerms.has(keyword) ? 1 : 0)
        );
      }, 0);
      const phraseScore = currentPhrases.reduce(
        (score, phrase) => score + (pageText.includes(phrase) ? 20 : 0),
        0,
      );
      return {
        asset,
        index,
        score: weightedTerms + phraseScore - (priorIds.has(asset.id) ? 2 : 0),
      };
    })
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, 6)
    .map(({ asset }) => asset);
};

const shortlistScreenshots = async (
  assets: readonly ScreenshotAsset[],
  input: ScreenshotAssistantInput,
): Promise<ScreenshotAsset[]> => {
  const rankedCandidates = input.toolIds.flatMap((toolId) =>
    candidateFallback(
      assets.filter((asset) => asset.toolId === toolId),
      input,
    ).slice(0, 6),
  );
  const entryCandidates = input.requireEntryScene
    ? input.toolIds.flatMap((toolId) => {
        const entryPool = assets.filter(
          (asset) => asset.toolId === toolId && isEntryAsset(asset),
        );
        const connectedHomepages = entryPool.filter((asset) =>
          /\bhome\s?page\b|\bhomepage\b|\blanding page\b/i.test(
            `${asset.id} ${asset.filename} ${asset.label}`,
          ),
        );
        return candidateFallback(
          connectedHomepages.length > 0 ? connectedHomepages : entryPool,
          input,
        ).slice(0, 1);
      })
    : [];
  const entryTargets = entryCandidates.flatMap((entry) => {
    const targetIds = new Set(
      entry.transitions.map((transition) => transition.targetId),
    );
    return candidateFallback(
      assets.filter(
        (asset) => asset.toolId === entry.toolId && targetIds.has(asset.id),
      ),
      input,
    ).slice(0, 2);
  });
  const entryDescendants = entryTargets.flatMap((entryTarget) => {
    const targetIds = new Set(
      entryTarget.transitions.map((transition) => transition.targetId),
    );
    return candidateFallback(
      assets.filter(
        (asset) =>
          asset.toolId === entryTarget.toolId && targetIds.has(asset.id),
      ),
      input,
    ).slice(0, 2);
  });
  const candidateLimit = Math.max(6, Math.min(input.toolIds.length, 3) * 6);
  const mergeCandidates = (
    selected: readonly ScreenshotAsset[] = [],
  ): ScreenshotAsset[] =>
    [
      ...entryCandidates,
      ...entryTargets,
      ...entryDescendants,
      ...selected,
      ...rankedCandidates.slice(0, 3),
      ...rankedCandidates.slice(3),
    ]
      .filter(
        (asset, index, entries) =>
          entries.findIndex((candidate) => candidate.id === asset.id) === index,
      )
      .slice(0, candidateLimit);
  if (assets.length <= candidateLimit) {
    return [...entryCandidates, ...assets].filter(
      (asset, index, entries) =>
        entries.findIndex((candidate) => candidate.id === asset.id) === index,
    );
  }

  const client = getOpenRouterClient();
  if (!client) {
    return mergeCandidates();
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
            "Select up to six screenshot IDs per selected tool that are most likely to help answer the current software-training question. Return no more than eighteen IDs total. " +
            "Use the human-reviewed website and reference description in the complete screenshot index, plus the scenario and recent conversation. " +
            "Treat the reference description as authoritative for page identity, visible controls, filters, and captured state. " +
            "The current question has priority over the original scenario and earlier turns. If it explicitly names a page or topic, prefer screenshots whose page identity or main content matches it; seeing that phrase only in shared navigation is not a page match. " +
            "Previously shown screenshot IDs are context, not defaults. Reuse one only when it remains the best evidence for the current question. " +
            (input.requireEntryScene
              ? "This is the initial teaching answer. Include the most relevant supplied homepage or landing-page screenshot for each applicable tool so the learner can be guided from a known entry point. "
              : "") +
            "Follow-up questions may refer to the first or latest earlier answer. " +
            "Return only JSON with screenshotIds. Do not answer the question and do not invent IDs.",
        },
        {
          role: "user",
          content: `Training objective:\n${input.scenario}\n\nRecent conversation:\n${conversationText(input.history)}\n\nPreviously shown screenshot IDs:\n${input.priorScreenshotIds?.join(", ") || "None"}\n\nCurrent question:\n${input.question}\n\nComplete screenshot keyword index:\n${getScreenshotKeywordIndex(assets)}`,
        },
      ],
    });
    const raw = response.choices[0]?.message.content;
    const parsed = raw ? candidateSchema.safeParse(JSON.parse(raw)) : undefined;
    if (!parsed?.success) {
      return mergeCandidates();
    }
    const selected = parsed.data.screenshotIds.flatMap((id) => {
      const asset = getScreenshotAsset(id);
      return asset && assets.some((candidate) => candidate.id === id)
        ? [asset]
        : [];
    });
    return mergeCandidates(selected);
  } catch {
    return mergeCandidates();
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

const toGridHighlight = (
  highlight: z.infer<typeof normalizedHighlightSchema>,
): z.infer<typeof normalizedHighlightSchema> => {
  const scale = Math.max(
    highlight.x,
    highlight.y,
    highlight.width,
    highlight.height,
  ) > 1
    ? 1
    : 1_000;
  return {
    x: Math.round(highlight.x * scale),
    y: Math.round(highlight.y * scale),
    width: Math.round(highlight.width * scale),
    height: Math.round(highlight.height * scale),
  };
};

const validateHighlight = async ({
  asset,
  question,
  title,
  instruction,
  highlightTarget,
  caption,
  referenceDescription,
  highlight,
}: {
  asset: ScreenshotAsset;
  question: string;
  title: string;
  instruction: string;
  highlightTarget: string;
  caption: string;
  referenceDescription: string;
  highlight: z.infer<typeof normalizedHighlightSchema>;
}): Promise<z.infer<typeof normalizedHighlightSchema> | null> => {
  const client = getOpenRouterClient();
  if (!client) {
    return null;
  }
  try {
    let candidate = highlight;
    let lastValidation: unknown;
    const maximumValidationPasses = 4;
    for (let attempt = 0; attempt < maximumValidationPasses; attempt += 1) {
      const response = await client.chat.completions.create({
        model: getRecommendationModel(),
        temperature: 0,
        max_tokens: 1_200,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Independently validate a proposed training highlight against the supplied screenshot. " +
              "Return only JSON with confirmed, confidence from 0 to 1, reason, and correctedHighlight. Confirm only when the rectangle tightly encloses the exact visible highlight target without primarily covering unrelated content. " +
              "When it is wrong but the target is visible, set confirmed false and provide a tight correctedHighlight using x, y, width, and height on a 0-to-1000 grid. Use null correctedHighlight if no valid target is visible. A corrected rectangle will be independently checked again; do not approve merely because it was suggested by an earlier pass.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  `Current question: ${question}\nScreenshot title: ${title}\nLearner action: ${instruction}\nExact visible highlight target: ${highlightTarget}\nCaption describing the current screenshot: ${caption}\nHuman-reviewed reference: ${referenceDescription}\nProposed rectangle: ${JSON.stringify(toGridHighlight(candidate))}\nValidation pass: ${attempt + 1} of ${maximumValidationPasses}\nScreenshot ID: ${asset.id}`,
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
        ? highlightValidationSchema.safeParse(JSON.parse(raw))
        : undefined;
      lastValidation = parsed?.success ? parsed.data : raw;
      if (
        parsed?.success &&
        parsed.data.confirmed &&
        parsed.data.confidence >= 0.8
      ) {
        return candidate;
      }
      if (
        attempt < maximumValidationPasses - 1 &&
        parsed?.success &&
        parsed.data.correctedHighlight
      ) {
        candidate = parsed.data.correctedHighlight;
        continue;
      }
    }
    console.warn("Screenshot highlight validation rejected", {
      screenshotId: asset.id,
      validation: lastValidation,
    });
    return null;
  } catch {
    return null;
  }
};

const refineHighlight = async ({
  asset,
  question,
  title,
  instruction,
  highlightTarget,
  caption,
  referenceDescription,
  fallback,
}: {
  asset: ScreenshotAsset;
  question: string;
  title: string;
  instruction: string;
  highlightTarget: string;
  caption: string;
  referenceDescription: string;
  fallback?: z.infer<typeof normalizedHighlightSchema>;
}): Promise<z.infer<typeof normalizedHighlightSchema> | null> => {
  const client = getOpenRouterClient();
  if (!client) {
    return null;
  }

  try {
    const requestHighlight = () => client.chat.completions.create({
      model: getRecommendationModel(),
      temperature: 0,
      max_tokens: 1_200,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Locate exactly the one visible interface control or content region named as the highlight target. " +
            "Return only JSON with targetVisible, targetDescription, confidence from 0 to 1, and highlight containing x, y, width, and height on a 0-to-1000 coordinate grid, or null highlight when the target is not visible. " +
            "The target may change dynamically with the instruction: it may be a button, link, filter, tab, menu, field, result, heading, card, or short content panel. If the requested target is broad, choose the smallest representative visible subregion that directly supports it and name that exact subregion in targetDescription. Make the rectangle tight around targetDescription; do not frame the whole page, a long body-text block, a complete long list, unrelated results, or decorative content.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Current question: ${question}\nScreenshot title: ${title}\nLearner action: ${instruction}\nExact visible highlight target: ${highlightTarget}\nCaption describing the current screenshot: ${caption}\nHuman-reviewed reference: ${referenceDescription}\nScreenshot ID: ${asset.id}`,
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
    let raw: string | null | undefined;
    let parsed: ReturnType<typeof highlightLocatorSchema.safeParse> | undefined;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response = await requestHighlight();
      raw = response.choices[0]?.message.content;
      parsed = raw
        ? highlightLocatorSchema.safeParse(JSON.parse(raw))
        : undefined;
      if (parsed?.success) {
        break;
      }
    }
    if (
      !parsed?.success ||
      !parsed.data.targetVisible ||
      parsed.data.confidence < 0.75 ||
      !parsed.data.highlight
    ) {
      console.warn("Screenshot highlight locator could not confirm a target", {
        screenshotId: asset.id,
        locator: parsed?.success ? parsed.data : raw,
      });
    }
    const proposed =
      parsed?.success &&
      parsed.data.targetVisible &&
      parsed.data.confidence >= 0.75 &&
      parsed.data.highlight
        ? parsed.data.highlight
        : fallback || null;
    const validatedTarget =
      parsed?.success && parsed.data.targetVisible
        ? parsed.data.targetDescription
        : highlightTarget;
    if (!proposed) {
      return null;
    }
    return await validateHighlight({
      asset,
      question,
      title,
      instruction,
      highlightTarget: validatedTarget,
      caption,
      referenceDescription,
      highlight: proposed,
    });
  } catch {
    return null;
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
  const requiredEntryAssets = input.requireEntryScene
    ? effectiveToolIds.flatMap((toolId) => {
        const entry = candidates.find(
          (asset) => asset.toolId === toolId && isEntryAsset(asset),
        );
        return entry ? [entry] : [];
      })
    : [];
  const requiredEntryText = requiredEntryAssets.length > 0
    ? requiredEntryAssets
        .map((asset) => `${asset.toolId}: ${asset.id}`)
        .join("\n")
    : "None";
  const client = getOpenRouterClient();

  if (!client) {
    return {
      answer:
        "The screenshot library is available, but OpenRouter is not configured to interpret this question. Add the API key and retry.",
      guides: [],
      scenes: [],
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
        `Training objective:\n${input.scenario}\n\nCandidate tool roles:\n${toolRoles}\n\nRecent conversation (use this to resolve references to earlier questions):\n${conversationText(input.history)}\n\nPreviously shown screenshot IDs:\n${input.priorScreenshotIds?.join(", ") || "None"}\n\nCurrent question (answer this question, not an earlier one):\n${input.question}\n\n` +
        (input.requireEntryScene
          ? `Initial-answer access requirement: begin at the required supplied homepage or landing page for each applicable tool, then continue to the destination content when supported.\nRequired entry screenshot IDs by tool:\n${requiredEntryText}\n\n`
          : "") +
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
        `Confirmed next screenshot paths: ${asset.transitions.length > 0
          ? asset.transitions
              .map(
                (transition) =>
                  `${transition.action} -> ${transition.targetId} (${transition.verification})`,
              )
              .join("; ")
          : "None"}\n` +
        `Shared controls for this website family: ${asset.sharedControls}\n` +
        `Search keywords: ${asset.keywords.join(", ")}`,
    });
    content.push({
      type: "image_url",
      image_url: { url: getThumbnailDataUrl(asset), detail: "low" },
    });
  }

  const visionSystemPrompt =
    "You are a software-training tutor with vision. Return only JSON with answer, imageCanAnswer, and steps. Steps must be an ordered array containing zero to three objects per selected tool and no more than nine objects total. Each object contains screenshotId, title, instruction, expectedResult, caption, and highlightTarget. Group each tool's steps together; never leave a tool and later return to it. A separate visual process will locate and validate highlights. " +
    "Answer the current question directly. Use recent conversation to resolve pronouns and references, but do not repeat an earlier answer when the current question changed. " +
    "Each candidate has human-reviewed reference metadata. Treat that metadata as authoritative for website identity, visible control names, filters, options, and expanded or selected state; use the image to confirm position and visual context. " +
    "Confirmed next screenshot paths are also authoritative. Within each tool, every consecutive pair must be connected by a listed path from the earlier screenshot to the next screenshot. The earlier step must instruct the exact listed visible action. A change to another tool starts a separate route at that tool's required entry screenshot; never imply that a click moved between websites. Never arrange merely related pages as though clicking one produces the other. If relevant screenshots belong to separate branches of one tool, choose one connected branch and explain the other limitation in text. " +
    "A technically valid path is not enough: choose the connected branch that directly addresses the central intent and the greatest number of the user's requested needs. Do not substitute a merely related news, media, announcement, or marketing page for an authoritative source requested by the user. When the supplied screenshots cannot show an authoritative source, say so in the answer and teach the strongest supported primary branch instead of implying that an announcement page is the source of record. " +
    "The current question outranks the original scenario and earlier screenshots. If it names a page or topic, use images whose page identity or main content matches that topic. A term appearing only in shared header navigation can support instructions for opening that page, but cannot support claims about what is inside the page. Previously shown screenshots may be reused only when they are still the strongest evidence. " +
    "Inspect every candidate image and use the minimum evidence needed. Use one step for a narrow control question. For a broad feature or learning objective, use an ordered sequence when supported: first show how to access the relevant area, then show the destination or useful controls inside it. For a multi-tool objective, include each selected tool only when a relevant candidate exists. Do not repeat the same screenshot in multiple steps. " +
    (input.requireEntryScene
      ? `This is the initial teaching answer. The required entry screenshot IDs are:\n${requiredEntryText}\nFor each listed tool, its first scene must use that exact entry image and point to the visible navigation or call-to-action that begins the route. Do not start on an inside content page merely because it contains the strongest topical text. Then use later scenes for the destination's useful content and controls. `
      : "") +
    "Set imageCanAnswer true when supplied images materially help. Use no more than three screenshots for each selected tool. Every step must use an exact candidate ID. highlightTarget must name exactly one compact visible button, link, filter, tab, field, result, heading, card, or short contiguous content region in the current screenshot that can be enclosed by one tight box. Prefer the smallest useful named element; never target an entire page, a long body-text block, or a complete long list. Do not combine distant targets. For a scroll-only transition, name one compact piece of current content the learner should inspect before scrolling; do not claim that scrolling itself is visible. " +
    "Write concrete instructions naming exact visible controls and actions; avoid generic wording such as explore, visit the website, or use the search. Caption must describe only what is currently visible in that screenshot. ExpectedResult must describe what should happen after carrying out the instruction and must not be presented as something already visible. If no image helps, set imageCanAnswer false and steps to an empty array. " +
    "Never invent a control missing from the reference and image, an unseen click result, legal conclusion, or cross-tool handoff. State when guidance is based only on a supplied screenshot.";

  const followsRequiredEntryOrder = (
    decision: z.infer<typeof visualDecisionSchema>,
  ): boolean =>
    requiredEntryAssets.every((entry) => {
      const firstToolStep = decision.steps.find((step) =>
        candidates.some(
          (candidate) =>
            candidate.id === step.screenshotId &&
            candidate.toolId === entry.toolId,
        ),
      );
      return firstToolStep?.screenshotId === entry.id;
    });
  const followsConfirmedScreenshotPath = (
    decision: z.infer<typeof visualDecisionSchema>,
  ): boolean =>
    followsConfirmedScreenshotPaths(
      decision.steps.map((step) => step.screenshotId),
    );
  const staysWithinPerToolSceneLimit = (
    decision: z.infer<typeof visualDecisionSchema>,
  ): boolean => {
    const counts = new Map<ToolId, number>();
    for (const step of decision.steps) {
      const asset = candidates.find(
        (candidate) => candidate.id === step.screenshotId,
      );
      if (!asset) {
        return false;
      }
      const count = (counts.get(asset.toolId) || 0) + 1;
      if (count > 3) {
        return false;
      }
      counts.set(asset.toolId, count);
    }
    return true;
  };

  try {
    let response = await client.chat.completions.create({
      model: getRecommendationModel(),
      temperature: 0.1,
      max_tokens: 4_000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: visionSystemPrompt,
        },
        { role: "user", content },
      ],
    });
    let raw = response.choices[0]?.message.content;
    if (!raw) {
      throw new Error("OpenRouter returned no contextual answer.");
    }
    let rawDecision = JSON.parse(raw);
    let parsedDecision = visualDecisionSchema.safeParse(rawDecision);
    if (!parsedDecision.success) {
      console.error("Invalid screenshot decision", rawDecision);
      throw parsedDecision.error;
    }
    if (
      (requiredEntryAssets.length > 0 &&
        !followsRequiredEntryOrder(parsedDecision.data)) ||
      !followsConfirmedScreenshotPath(parsedDecision.data) ||
      !staysWithinPerToolSceneLimit(parsedDecision.data)
    ) {
      response = await client.chat.completions.create({
        model: getRecommendationModel(),
        temperature: 0,
        max_tokens: 4_000,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              `${visionSystemPrompt} CORRECTION REQUIRED: the previous draft skipped a required entry scene, exceeded three screenshots for a tool, returned to a tool after leaving it, or used same-tool consecutive screenshots without a confirmed path. Return a corrected complete answer. The first scene for each listed tool must use its exact required entry screenshot ID. Within a tool, every scene-to-scene transition must match a Confirmed next screenshot path supplied for the earlier image. A switch to another tool begins a separate route.`,
          },
          { role: "user", content },
        ],
      });
      raw = response.choices[0]?.message.content;
      if (!raw) {
        throw new Error("OpenRouter returned no corrected contextual answer.");
      }
      rawDecision = JSON.parse(raw);
      parsedDecision = visualDecisionSchema.safeParse(rawDecision);
      if (!parsedDecision.success) {
        console.error("Invalid corrected screenshot decision", rawDecision);
        throw parsedDecision.error;
      }
      if (
        !followsRequiredEntryOrder(parsedDecision.data) ||
        !followsConfirmedScreenshotPath(parsedDecision.data) ||
        !staysWithinPerToolSceneLimit(parsedDecision.data)
      ) {
        throw new Error(
          "The screenshot sequence did not follow its confirmed navigation path.",
        );
      }
    }
    const decision = parsedDecision.data;
    const answer = decision.answer;
    if (!answer) {
      throw new Error("OpenRouter returned no direct answer.");
    }
    const resolvedSteps = decision.imageCanAnswer
      ? decision.steps.flatMap((step) => {
          const asset = candidates.find(
            (candidate) => candidate.id === step.screenshotId,
          );
          return asset &&
            step.title &&
            step.instruction &&
            step.expectedResult &&
            step.caption
            ? [{ asset, step }]
            : [];
        }).filter(
          ({ asset }, index, entries) =>
            entries.findIndex((entry) => entry.asset.id === asset.id) === index,
        )
      : [];
    if (resolvedSteps.length === 0) {
      return {
        answer,
        guides: [],
        scenes: [],
        resolvedToolIds: effectiveToolIds,
      };
    }

    const prepared = await Promise.all(
      resolvedSteps.map(async ({ asset, step }, index) => {
        const tool = getCatalogTool(asset.toolId);
        const nextAsset = resolvedSteps[index + 1]?.asset;
        const confirmedTransition = nextAsset
          ? asset.transitions.find(
              (transition) => transition.targetId === nextAsset.id,
            )
          : undefined;
        const instruction = confirmedTransition?.action || step.instruction!;
        const highlightTarget = step.highlightTarget || step.title!;
        const parsedFallback = normalizedHighlightSchema.safeParse(
          step.highlight,
        );
        const normalizedHighlight = await refineHighlight({
          asset,
          question: input.question,
          title: step.title!,
          instruction,
          highlightTarget,
          caption: step.caption!,
          referenceDescription: asset.referenceDescription,
          fallback: parsedFallback.success ? parsedFallback.data : undefined,
        });
        if (!normalizedHighlight) {
          return null;
        }
        const highlight = toHighlight(asset, normalizedHighlight);
        const guide: ScreenshotGuide = {
          id: `${asset.id}-guide`,
          screenshotAssetId: asset.id,
          toolId: asset.toolId,
          toolName: tool?.name || asset.toolId,
          title: step.title!,
          instruction,
          expectedResult: step.expectedResult!,
          screenshot: asset.originalUrl,
          sourceWidth: asset.width,
          sourceHeight: asset.height,
          highlight,
          caption: step.caption!,
          evidenceStatus: "screenshot-observation" as const,
        };
        const scene: DynamicScreenshotScene = {
          screenshotAssetId: asset.id,
          toolId: asset.toolId,
          toolName: guide.toolName,
          title: guide.title,
          instruction: guide.instruction,
          expectedResult: guide.expectedResult,
          caption: guide.caption,
          highlight,
        };
        return { guide, scene };
      }),
    );
    if (prepared.some((item) => !item)) {
      return {
        answer,
        guides: [],
        scenes: [],
        resolvedToolIds: effectiveToolIds,
      };
    }
    const validatedPrepared = prepared.filter(
      (item): item is NonNullable<typeof item> => Boolean(item),
    );
    return {
      answer,
      guides: validatedPrepared.map(({ guide }) => guide),
      scenes: validatedPrepared.map(({ scene }) => scene),
      resolvedToolIds: [
        ...new Set(validatedPrepared.map(({ scene }) => scene.toolId)),
      ],
    };
  } catch (error) {
    console.error("Screenshot-assisted answer failed", error);
    return {
      answer: isConnectionFailure(error)
        ? "I could not connect to OpenRouter, so screenshot interpretation and video generation are temporarily unavailable. Check network access and retry."
        : "I could not interpret the supplied screenshots for this question. Please retry; video coverage is unavailable until a matching image is confirmed.",
      guides: [],
      scenes: [],
      resolvedToolIds: effectiveToolIds,
    };
  }
};

export const answerWithScreenshotLibraryPerTool = async (
  input: ScreenshotAssistantInput,
): Promise<ScreenshotAssistantResult> => {
  if (input.toolIds.length <= 1) {
    return answerWithScreenshotLibrary(input);
  }

  const results = await Promise.all(
    input.toolIds.map(async (toolId) => {
      const tool = getCatalogTool(toolId);
      return {
        toolId,
        result: await answerWithScreenshotLibrary({
          ...input,
          toolIds: [toolId],
          question:
            `${input.question}\n\nThis is the independent ${tool?.name || toolId} screenshot route. ` +
            `Focus only on the parts of the objective directly supported by this tool's intended role: ${tool?.intendedUse || "its catalog description"}. ` +
            "Do not add tangential scenes merely to use the three-scene allowance; one or two scenes are correct when they fully cover this tool's relevant role.",
        }),
      };
    }),
  );

  return {
    answer: results
      .map(({ toolId, result }) => {
        const toolName = getCatalogTool(toolId)?.name || toolId;
        return `${toolName}: ${result.answer}`;
      })
      .join("\n\n"),
    guides: results.flatMap(({ result }) => result.guides),
    scenes: results.flatMap(({ result }) => result.scenes),
    resolvedToolIds: results.flatMap(({ result }) => result.resolvedToolIds),
  };
};
