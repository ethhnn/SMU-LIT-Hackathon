import { getCatalogTool, type ToolId } from "@/lib/catalog";
import type { SharedGuidanceResponse } from "@/lib/contracts";
import {
  getDynamicLessonPlanId,
  getDynamicSupportTopicId,
  type DynamicScreenshotScene,
} from "@/lib/dynamic-scene";
import { answerWithScreenshotLibraryPerTool } from "@/lib/screenshot-assistant";
import { getInitialTeachingItems } from "@/lib/support-topics";

type SharedGuidanceInput = {
  scenario: string;
  toolIds: ToolId[];
};

export type SharedGuidanceResult = {
  response: SharedGuidanceResponse;
  dynamicScenes?: DynamicScreenshotScene[];
};

export const getSharedGuidance = async (
  input: SharedGuidanceInput,
): Promise<SharedGuidanceResult> => {
  const tools = input.toolIds.flatMap((toolId) => {
    const tool = getCatalogTool(toolId);
    return tool ? [tool] : [];
  });
  const generated = await answerWithScreenshotLibraryPerTool({
    scenario: input.scenario,
    toolIds: input.toolIds,
    question:
      `Teach me how to carry out this objective using the supplied interface evidence: ${input.scenario}. ` +
      "Use the minimum useful ordered sequence: show how to access a relevant area first when needed, then explain the useful controls or content visible inside it.",
    history: [],
    priorScreenshotIds: [],
    requireEntryScene: true,
  });
  const hasAnyValidatedScene = generated.scenes.length > 0;
  const guides = input.toolIds.flatMap((toolId) => {
    const generatedGuides = generated.guides.filter(
      (guide) => guide.toolId === toolId,
    );
    if (generatedGuides.length > 0) {
      return generatedGuides;
    }

    // For an initial multi-tool lesson, retain any existing human-reviewed
    // baseline when this request's dynamic box validation fails for one tool.
    // Do not use the fallback for a total model/network failure or contextual
    // follow-ups, where relevance must be freshly established.
    return input.toolIds.length > 1 && hasAnyValidatedScene
      ? getInitialTeachingItems([toolId])
      : [];
  });
  const groundedGuides = guides.filter(
    (guide): guide is typeof guide & { screenshotAssetId: string } =>
      Boolean(guide.screenshotAssetId),
  );
  const scenes: DynamicScreenshotScene[] = groundedGuides.map((guide) => ({
    screenshotAssetId: guide.screenshotAssetId,
    toolId: guide.toolId,
    toolName: guide.toolName,
    title: guide.title,
    instruction: guide.instruction,
    expectedResult: guide.expectedResult,
    caption: guide.caption,
    highlight: guide.highlight,
  }));
  const coversExactSelection =
    scenes.length > 0 &&
    input.toolIds.every((toolId) =>
      scenes.some((scene) => scene.toolId === toolId),
    );
  const toolsWithoutValidatedScenes = tools.filter(
    (tool) => !scenes.some((scene) => scene.toolId === tool.id),
  );
  const lessonPlanId = scenes.length > 0
    ? getDynamicLessonPlanId(scenes)
    : undefined;
  const supportTopicId = scenes.length > 0
    ? getDynamicSupportTopicId(scenes)
    : undefined;

  return {
    response: {
      message: generated.answer,
      teachingItems: groundedGuides,
      canGenerateHelpClip: coversExactSelection,
      lessonPlanId: coversExactSelection ? lessonPlanId : undefined,
      supportTopicId: coversExactSelection ? supportTopicId : undefined,
      missingCoverage: coversExactSelection
        ? []
        : input.toolIds.length > 1
          ? toolsWithoutValidatedScenes.map(
              (tool) =>
                `${tool.name}: no complete screenshot route with validated highlights was confirmed for this objective. The combined video remains unavailable until every selected tool has at least one grounded scene.`,
            )
          : [
              "No supplied screenshot was confirmed as a grounded video scene for this objective.",
            ],
    },
    dynamicScenes: coversExactSelection ? scenes : undefined,
  };
};
