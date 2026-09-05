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
    .min(1)
    .max(3),
});

type ScoredTool = {
  toolId: ToolId;
  score: number;
};

const scoreScenario = (scenario: string): ScoredTool[] => {
  const normalized = scenario.toLowerCase();
  const scenarioTerms = new Set(normalized.match(/[a-z0-9]+/g) || []);
  const scores: ScoredTool[] = TOOL_CATALOG.map((tool) => {
    const searchable = [
      tool.id,
      tool.name,
      tool.intendedUse,
      ...tool.capabilities,
    ]
      .join(" ")
      .toLowerCase();
    const catalogTerms = new Set(searchable.match(/[a-z0-9]+/g) || []);
    const score = [...scenarioTerms].filter(
      (term) => term.length > 2 && catalogTerms.has(term),
    ).length;
    return { toolId: tool.id, score };
  });

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
            "You recommend software from a small, curated training catalog. " +
            "Return only JSON with a recommendations array. Each entry must have toolId. " +
            "Select only tools whose stated intended use or capabilities directly satisfy part of the objective; fewer accurate recommendations are better than adjacent but unsupported ones. Treat legislation, official gazettes, judgments, guidance, media announcements, document comparison, and document management as distinct needs. Never recommend a judgments tool as a source of enacted legislation, or a media page as an authoritative publication source. If the catalog does not cover part of the objective, do not disguise that gap by selecting an unrelated tool. " +
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
    const recommendations = buildRecommendations(distinct);

    return recommendations.length > 0
      ? { recommendations, source: "openrouter" }
      : recommendFromCatalog(scenario);
  } catch {
    return recommendFromCatalog(scenario);
  }
};
