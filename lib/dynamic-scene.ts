import { createHash } from "node:crypto";

import type { ToolId } from "@/lib/catalog";
import type { Highlight } from "@/lib/openlaw-workflow";

export type DynamicScreenshotScene = {
  screenshotAssetId: string;
  toolId: ToolId;
  toolName: string;
  title: string;
  instruction: string;
  expectedResult: string;
  caption: string;
  highlight: Highlight;
};

export const getDynamicSceneKey = (
  scenes: readonly DynamicScreenshotScene[],
): string =>
  createHash("sha256")
    .update(scenes.map((scene) => scene.screenshotAssetId).join("|"))
    .digest("hex")
    .slice(0, 24);

export const getDynamicLessonPlanId = (
  scenes: readonly DynamicScreenshotScene[],
): string => `contextual-${getDynamicSceneKey(scenes)}`;

export const getDynamicSupportTopicId = (
  scenes: readonly DynamicScreenshotScene[],
): string => `screenshots:${getDynamicSceneKey(scenes)}`;
