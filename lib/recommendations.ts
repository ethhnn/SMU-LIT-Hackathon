import { z } from "zod";

import {
  getCatalogTool,
  isToolId,
  TOOL_CATALOG,
  type ToolId,
} from "@/lib/catalog";
import type { RecommendationResponse, RecommendedTool } from "@/lib/contracts";
import { getOpenRouterClient, getRecommendationModel } from "@/lib/openrouter";

const externalRecommendationSchema = z.object({
  recommendations: z
    .array(
      z.object({
        toolId: z.string(),
      }),
    )
    .max(3),
});

type ScoredTool = {
  toolId: ToolId;
  score: number;
};

const TOOL_MATCHERS: Record<ToolId, readonly RegExp[]> = {
  tafep: [
    /\btafep\b/i,
    /\bworkplace\b/i,
    /\bemploy(?:ment|er|ee|ees|ers)\b/i,
    /\bfair(?:ness)?\b/i,
    /\bunfair\b/i,
    /\bdiscriminat(?:e|ion|ory)\b/i,
    /\bharass(?:ment|ed|ing)?\b/i,
    /\btripartite\b/i,
  ],
  openlaw: [
    /\bopenlaw\b/i,
    /\blawnet\b/i,
    /\bjudg(?:e)?ment(?:s)?\b/i,
    /\bcase law\b/i,
    /\blegal precedent(?:s)?\b/i,
    /\bsupreme court decision(?:s)?\b/i,
  ],
  judiciary: [
    /\bjudiciary(?:\.gov\.sg)?\b/i,
    /\bsg courts?\b/i,
    /\bcourt (?:information|services?|hearings?|listings?|guides?)\b/i,
    /\bhearing (?:search|date|dates|listings?)\b/i,
    /\bfile (?:a )?(?:claim|case)\b/i,
    /\bsheriff'?s sales?\b/i,
    /\bfamily justice\b/i,
    /\bstate courts?\b/i,
  ],
};

const scoreScenario = (scenario: string): ScoredTool[] => {
  const scores: ScoredTool[] = TOOL_CATALOG.map((tool) => ({
    toolId: tool.id,
    score: TOOL_MATCHERS[tool.id].filter((matcher) => matcher.test(scenario)).length,
  }));

  const matches = scores
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  if (matches.length > 0) {
    return matches.slice(0, 3);
  }

  return [];
};

const buildRecommendations = (
  entries: ReadonlyArray<{ toolId: ToolId }>,
): RecommendedTool[] =>
  entries.flatMap(({ toolId }) => {
    const tool = getCatalogTool(toolId);
    return tool
      ? [{ tool, reason: `${tool.name} matches this objective through its curated role: ${tool.intendedUse}` }]
      : [];
  });

export const recommendFromCatalog = (scenario: string): RecommendationResponse => ({
  recommendations: buildRecommendations(scoreScenario(scenario)),
  source: "catalog-fallback",
});

const catalogPrompt = TOOL_CATALOG.map(
  (tool) =>
    `- ${tool.id}: ${tool.name}. Intended use: ${tool.intendedUse}. Capabilities: ${tool.capabilities.join(", ")}. Limitations: ${tool.cons.join("; ")}.`,
).join("\n");

export const recommendTools = async (
  scenario: string,
): Promise<RecommendationResponse> => {
  const client = getOpenRouterClient();

  if (!client) {
    return recommendFromCatalog(scenario);
  }

  try {
    const response = await client.chat.completions.create({
      model: getRecommendationModel(),
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You recommend software only from the three tools in the curated training catalog below. " +
            "Return only JSON with a recommendations array. Each entry must have toolId. " +
            "Every toolId must exactly match an ID in the supplied catalog. Never name, suggest, or substitute any tool outside that catalog. " +
            "Select only tools whose stated intended use or capabilities directly satisfy part of the objective; fewer accurate recommendations are better than adjacent but unsupported ones. If no catalog tool directly fits, return an empty recommendations array. Treat legislation, official gazettes, judgments, guidance, media announcements, document comparison, and document management as distinct needs. Never recommend a judgments tool as a source of enacted legislation, or a media page as an authoritative publication source. If the catalog does not cover part of the objective, do not disguise that gap by selecting an unrelated tool. " +
            "Do not give legal advice, determine legal relevance, " +
            "invent operational workflows, or describe cross-tool handoffs. Do not claim tutorial coverage.",
        },
        {
          role: "user",
          content: `Training objective:\n${scenario}\n\nCatalog:\n${catalogPrompt}`,
        },
      ],
    });

    const rawContent = response.choices[0]?.message.content;
    if (!rawContent) {
      return recommendFromCatalog(scenario);
    }

    const parsed = externalRecommendationSchema.safeParse(JSON.parse(rawContent));
    if (!parsed.success) {
      return recommendFromCatalog(scenario);
    }

    const distinct = parsed.data.recommendations.filter(
      (entry, index, entries) =>
        isToolId(entry.toolId) &&
        entries.findIndex((candidate) => candidate.toolId === entry.toolId) === index,
    ) as Array<{ toolId: ToolId }>;
    const directMatches = new Set(scoreScenario(scenario).map((entry) => entry.toolId));
    const recommendations = buildRecommendations(
      distinct.filter((entry) => directMatches.has(entry.toolId)),
    );

    return recommendations.length > 0
      ? { recommendations, source: "openrouter" }
      : recommendFromCatalog(scenario);
  } catch {
    return recommendFromCatalog(scenario);
  }
};
