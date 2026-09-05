import { describe, expect, it, vi } from "vitest";

const { answerWithScreenshotLibraryPerTool } = vi.hoisted(() => ({
  answerWithScreenshotLibraryPerTool: vi.fn(),
}));

vi.mock("@/lib/screenshot-assistant", () => ({
  answerWithScreenshotLibraryPerTool,
}));

import { getSharedGuidance } from "@/lib/guidance";

const tafepGuide = {
  id: "tafep-home-guide",
  screenshotAssetId: "tafep-tafep-homepage-workplace-fairness-act",
  toolId: "tafep" as const,
  toolName: "TAFEP",
  title: "Open Workplace Fairness",
  instruction: "Select Workplace Fairness in the header.",
  expectedResult: "The Workplace Fairness page opens.",
  screenshot:
    "/assets/screenshots/tafep/original/tafep-homepage-workplace-fairness-act.png",
  sourceWidth: 1920,
  sourceHeight: 1080,
  highlight: { x: 1000, y: 100, width: 220, height: 60 },
  caption: "The supplied TAFEP homepage.",
  evidenceStatus: "screenshot-observation" as const,
};

describe("shared guidance reviewed baseline", () => {
  it("keeps a selected tool represented when its dynamic box fails but a reviewed baseline exists", async () => {
    answerWithScreenshotLibraryPerTool.mockResolvedValueOnce({
      answer: "TAFEP and OpenLaw each support part of this objective.",
      guides: [tafepGuide],
      scenes: [
        {
          screenshotAssetId: tafepGuide.screenshotAssetId,
          toolId: tafepGuide.toolId,
          toolName: tafepGuide.toolName,
          title: tafepGuide.title,
          instruction: tafepGuide.instruction,
          expectedResult: tafepGuide.expectedResult,
          caption: tafepGuide.caption,
          highlight: tafepGuide.highlight,
        },
      ],
      resolvedToolIds: ["tafep"],
    });

    const result = await getSharedGuidance({
      scenario: "Research fair workplace practices and related judgments.",
      toolIds: ["tafep", "openlaw"],
    });

    expect(result.response.teachingItems.map((guide) => guide.toolId)).toEqual([
      "tafep",
      "openlaw",
    ]);
    expect(result.response.teachingItems[1]).toMatchObject({
      screenshotAssetId: "openlaw-lawnet-openlaw-judgments-expanded-sidebar",
      evidenceStatus: "reviewed-instruction",
    });
    expect(result.response.canGenerateHelpClip).toBe(true);
    expect(result.response.missingCoverage).toEqual([]);
    expect(result.dynamicScenes).toHaveLength(2);
  });

  it("does not invent fallback coverage when every generated route failed", async () => {
    answerWithScreenshotLibraryPerTool.mockResolvedValueOnce({
      answer: "I could not connect to OpenRouter.",
      guides: [],
      scenes: [],
      resolvedToolIds: ["tafep", "openlaw"],
    });

    const result = await getSharedGuidance({
      scenario: "Research fair workplace practices and related judgments.",
      toolIds: ["tafep", "openlaw"],
    });

    expect(result.response.teachingItems).toEqual([]);
    expect(result.response.canGenerateHelpClip).toBe(false);
  });
});
