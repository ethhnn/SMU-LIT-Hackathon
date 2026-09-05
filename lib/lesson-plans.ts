import { getCatalogTool, type ToolId } from "@/lib/catalog";
import type { DynamicScreenshotScene } from "@/lib/dynamic-scene";
import { getOpenLawAction, type CursorPosition, type Highlight } from "@/lib/openlaw-workflow";
import { getSupportTopic, type GroundingStatus } from "@/lib/support-topics";
import { getScreenshotAsset } from "@/lib/screenshot-library";

export type LessonScene = {
  toolId: ToolId;
  toolName: string;
  actionId: string;
  title: string;
  reviewedCoreInstruction: string;
  caption: string;
  screenshot: string;
  sourceWidth: number;
  sourceHeight: number;
  highlight: Highlight;
  cursor: CursorPosition;
  evidenceStatus: Exclude<GroundingStatus, "coverage-limit">;
};

export type LessonPlan = {
  id: string;
  toolIds: readonly ToolId[];
  scenes: readonly LessonScene[];
};

const openLawSearchAction = getOpenLawAction("locate-search-field");
const openLaw = getCatalogTool("openlaw");

if (
  !openLawSearchAction?.tutorialAvailable ||
  !openLawSearchAction.reviewedCoreInstruction ||
  !openLawSearchAction.screenshot ||
  !openLawSearchAction.sourceWidth ||
  !openLawSearchAction.sourceHeight ||
  !openLawSearchAction.highlight ||
  !openLawSearchAction.cursor ||
  !openLaw
) {
  throw new Error("The reviewed OpenLaw Search-field scene must be available.");
}

export const LESSON_PLANS: readonly LessonPlan[] = [
  {
    id: "openlaw-locate-search-field",
    toolIds: ["openlaw"],
    scenes: [
      {
        toolId: "openlaw",
        toolName: openLaw.name,
        actionId: openLawSearchAction.id,
        title: openLawSearchAction.title,
        reviewedCoreInstruction: openLawSearchAction.reviewedCoreInstruction,
        caption: openLawSearchAction.caption,
        screenshot: openLawSearchAction.screenshot,
        sourceWidth: openLawSearchAction.sourceWidth,
        sourceHeight: openLawSearchAction.sourceHeight,
        highlight: openLawSearchAction.highlight,
        cursor: openLawSearchAction.cursor,
        evidenceStatus: "reviewed-instruction",
      },
    ],
  },
] as const;

export const selectionKey = (toolIds: readonly ToolId[]): string =>
  [...new Set(toolIds)].sort().join(",");

export const getLessonPlan = (lessonPlanId: string): LessonPlan | undefined =>
  LESSON_PLANS.find((plan) => plan.id === lessonPlanId);

export const getLessonPlanForSelection = (
  toolIds: readonly ToolId[],
): LessonPlan | undefined => {
  const requestedSelection = selectionKey(toolIds);
  return LESSON_PLANS.find(
    (plan) => selectionKey(plan.toolIds) === requestedSelection,
  );
};

export const getLessonPlanForSupportTopic = (
  supportTopicId: string,
): LessonPlan | undefined => {
  const topic = getSupportTopic(supportTopicId);
  if (!topic || topic.teachingItems.length === 0) {
    return undefined;
  }

  const existingPlan = getLessonPlan(topic.videoPlanId);
  if (existingPlan) {
    return existingPlan;
  }

  return {
    id: topic.videoPlanId,
    toolIds: [topic.toolId],
    scenes: topic.teachingItems.map((item) => ({
      toolId: item.toolId,
      toolName: item.toolName,
      actionId: topic.id,
      title: item.title,
      reviewedCoreInstruction: item.instruction,
      caption: item.caption,
      screenshot: item.screenshot,
      sourceWidth: item.sourceWidth,
      sourceHeight: item.sourceHeight,
      highlight: item.highlight,
      cursor: {
        x: item.highlight.x + item.highlight.width / 2,
        y: item.highlight.y + item.highlight.height / 2,
      },
      evidenceStatus: item.evidenceStatus,
    })),
  };
};

export const getLessonPlanForDynamicScene = (
  lessonPlanId: string,
  scene: DynamicScreenshotScene,
): LessonPlan | undefined => {
  const asset = getScreenshotAsset(scene.screenshotAssetId);
  if (
    !asset ||
    asset.toolId !== scene.toolId ||
    lessonPlanId !== `contextual-${asset.id}`
  ) {
    return undefined;
  }

  return {
    id: lessonPlanId,
    toolIds: [scene.toolId],
    scenes: [
      {
        toolId: scene.toolId,
        toolName: scene.toolName,
        actionId: asset.id,
        title: scene.title,
        reviewedCoreInstruction: scene.instruction,
        caption: scene.caption,
        screenshot: asset.originalUrl,
        sourceWidth: asset.width,
        sourceHeight: asset.height,
        highlight: scene.highlight,
        cursor: {
          x: scene.highlight.x + scene.highlight.width / 2,
          y: scene.highlight.y + scene.highlight.height / 2,
        },
        evidenceStatus: "screenshot-observation",
      },
    ],
  };
};

export const getMissingCoverage = (toolIds: readonly ToolId[]): string[] => {
  if (getLessonPlanForSelection(toolIds)) {
    return [];
  }

  return toolIds.flatMap((toolId) => {
    const tool = getCatalogTool(toolId);
    if (!tool) {
      return [];
    }

    return tool.id === "openlaw"
      ? [
          `${tool.name} has only the reviewed Search-field scene; a shared Lesson Plan for this selection is not yet added.`,
        ]
      : [
          `${tool.name} needs reviewed screenshots, instructions, and a shared Lesson Plan before it can appear in a Help Clip.`,
        ];
  });
};
