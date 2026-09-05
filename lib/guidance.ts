import { getCatalogTool, type ToolId } from "@/lib/catalog";
import type { SharedGuidanceResponse } from "@/lib/contracts";
import type { DynamicScreenshotScene } from "@/lib/dynamic-scene";
import { getMissingCoverage } from "@/lib/lesson-plans";
import { answerWithScreenshotLibrary } from "@/lib/screenshot-assistant";

type SharedGuidanceInput = {
  scenario: string;
  toolIds: ToolId[];
};

export type SharedGuidanceResult = {
  response: SharedGuidanceResponse;
  dynamicScene?: DynamicScreenshotScene;
};

export const getSharedGuidance = async (
  input: SharedGuidanceInput,
): Promise<SharedGuidanceResult> => {
  const tools = input.toolIds.flatMap((toolId) => {
    const tool = getCatalogTool(toolId);
    return tool ? [tool] : [];
  });
  const result = await answerWithScreenshotLibrary({
    scenario: input.scenario,
    toolIds: input.toolIds,
    question: `Show the visible software step that best helps me with this objective: ${input.scenario}`,
    history: [],
  });
  const coversExactSelection =
    Boolean(result.scene) &&
    input.toolIds.length === 1 &&
    result.scene?.toolId === input.toolIds[0];
  const lessonPlanId = result.scene
    ? `contextual-${result.scene.screenshotAssetId}`
    : undefined;
  const supportTopicId = result.scene
    ? `screenshot:${result.scene.screenshotAssetId}`
    : undefined;

  return {
    response: {
      message: result.guide
        ? coversExactSelection
          ? "The closest supplied screenshot for this objective is shown below. You can generate a narrated clip from this image or ask a more specific question."
          : "The closest supplied screenshot is shown below. A combined clip remains unavailable because one image does not cover every selected tool."
        : tools.length === 1
          ? `No supplied ${tools[0].name} screenshot was confirmed for this objective. Ask a more specific question below.`
          : "No supplied screenshot was confirmed for this selected set. Ask a more specific question below.",
      teachingItems: result.guide ? [result.guide] : [],
      canGenerateHelpClip: coversExactSelection,
      lessonPlanId: coversExactSelection ? lessonPlanId : undefined,
      supportTopicId: coversExactSelection ? supportTopicId : undefined,
      missingCoverage: coversExactSelection
        ? []
        : input.toolIds.length > 1
          ? getMissingCoverage(input.toolIds)
          : [
              "No supplied screenshot was confirmed as a grounded video scene for this objective.",
            ],
    },
    dynamicScene: coversExactSelection ? result.scene : undefined,
  };
};
