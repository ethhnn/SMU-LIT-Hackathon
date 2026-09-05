import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/openrouter", () => ({
  getOpenRouterClient: () => null,
  getRecommendationModel: () => "unused",
}));

import { recommendTools } from "@/lib/recommendations";

describe("catalog recommendation fallback", () => {
  it("matches workplace-fairness wording to TAFEP from catalog metadata", async () => {
    const result = await recommendTools(
      "I want resources about fair workplace practices and the Workplace Fairness Act.",
    );

    expect(result.recommendations[0]?.tool.id).toBe("tafep");
  });
});
