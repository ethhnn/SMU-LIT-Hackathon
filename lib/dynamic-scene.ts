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
