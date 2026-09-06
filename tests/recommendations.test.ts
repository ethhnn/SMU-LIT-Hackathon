import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/openrouter", () => ({
  getOpenRouterClient: () => null,
  getRecommendationModel: () => "unused",
}));

import { isToolId, TOOL_IDS } from "@/lib/catalog";
import { recommendTools } from "@/lib/recommendations";

describe("catalog recommendation fallback", () => {
  it("allows exactly the three predefined tools", () => {
    expect(TOOL_IDS).toEqual(["openlaw", "tafep", "judiciary"]);
    expect(isToolId("litera-compare")).toBe(false);
    expect(isToolId("imanage")).toBe(false);
    expect(isToolId("invented-tool")).toBe(false);
  });

  it("matches workplace-fairness wording to TAFEP from catalog metadata", async () => {
    const result = await recommendTools(
      "I want resources about fair workplace practices and the Workplace Fairness Act.",
    );

    expect(result.recommendations[0]?.tool.id).toBe("tafep");
  });

  it("returns no tools when the objective does not fit the predefined catalog", async () => {
    const result = await recommendTools(
      "I need a tool for editing music and scheduling social media posts.",
    );

    expect(result.recommendations).toEqual([]);
  });
});
