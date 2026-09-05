import { getCatalogTool, type ToolId } from "@/lib/catalog";
import { getOpenLawAction, type Highlight } from "@/lib/openlaw-workflow";

export type GroundingStatus =
  | "reviewed-instruction"
  | "screenshot-observation"
  | "coverage-limit";

export type ScreenshotGuide = {
  id: string;
  screenshotAssetId?: string;
  toolId: ToolId;
  toolName: string;
  title: string;
  instruction: string;
  expectedResult: string;
  screenshot: string;
  sourceWidth: number;
  sourceHeight: number;
  highlight: Highlight;
  caption: string;
  evidenceStatus: Exclude<GroundingStatus, "coverage-limit">;
};

export type SupportTopic = {
  id: string;
  toolId: ToolId;
  description: string;
  evidenceStatus: Exclude<GroundingStatus, "coverage-limit">;
  teachingItems: ScreenshotGuide[];
  videoPlanId: string;
};

const openLaw = getCatalogTool("openlaw");
const searchAction = getOpenLawAction("locate-search-field");

if (
  !openLaw ||
  !searchAction?.reviewedCoreInstruction ||
  !searchAction.expectedResult ||
  !searchAction.screenshot ||
  !searchAction.sourceWidth ||
  !searchAction.sourceHeight ||
  !searchAction.highlight
) {
  throw new Error("The reviewed OpenLaw screenshot guide must be available.");
}

const searchGuide: ScreenshotGuide = {
  id: "openlaw-search-field-guide",
  screenshotAssetId: "openlaw-lawnet-openlaw-judgments-expanded-sidebar",
  toolId: "openlaw",
  toolName: openLaw.name,
  title: searchAction.title,
  instruction: searchAction.reviewedCoreInstruction,
  expectedResult: searchAction.expectedResult,
  screenshot: searchAction.screenshot,
  sourceWidth: searchAction.sourceWidth,
  sourceHeight: searchAction.sourceHeight,
  highlight: searchAction.highlight,
  caption: searchAction.caption,
  evidenceStatus: "reviewed-instruction",
};

const dateGuide: ScreenshotGuide = {
  id: "openlaw-decision-date-guide",
  screenshotAssetId: "openlaw-lawnet-openlaw-judgments-decision-date-filter",
  toolId: "openlaw",
  toolName: openLaw.name,
  title: "Filter by Decision Date",
  instruction:
    "Use the Decision Date range in the left panel to set the earliest and latest years for the visible case list.",
  expectedResult:
    "The selected Decision Date range appears under Current Search Filters.",
  screenshot: "/assets/openlaw/openlaw-decision-date-filter.png",
  sourceWidth: 2047,
  sourceHeight: 1069,
  highlight: { x: 235, y: 340, width: 415, height: 190 },
  caption:
    "The supplied screenshot shows the Decision Date range and its Current Search Filters entry.",
  evidenceStatus: "screenshot-observation",
};

const sortGuide: ScreenshotGuide = {
  id: "openlaw-sort-order-guide",
  screenshotAssetId: "openlaw-lawnet-openlaw-judgments-sort-menu",
  toolId: "openlaw",
  toolName: openLaw.name,
  title: "Change the judgment sort order",
  instruction:
    "Open the sort menu above the results and choose the visible order that matches your task.",
  expectedResult:
    "The selected sort option is shown above the judgment list.",
  screenshot: "/assets/openlaw/openlaw-sort-menu.png",
  sourceWidth: 2047,
  sourceHeight: 1069,
  highlight: { x: 1604, y: 145, width: 274, height: 205 },
  caption:
    "The supplied screenshot shows Date: Oldest → Recent, Date: Recent → Oldest, and Title: A → Z.",
  evidenceStatus: "screenshot-observation",
};

export const SUPPORT_TOPICS: readonly SupportTopic[] = [
  {
    id: "openlaw-search-field",
    toolId: "openlaw",
    description:
      "Locating the Search field in the left panel of the public OpenLaw Supreme Court judgments page.",
    evidenceStatus: "reviewed-instruction",
    teachingItems: [searchGuide],
    videoPlanId: "openlaw-locate-search-field",
  },
  {
    id: "openlaw-decision-date",
    toolId: "openlaw",
    description:
      "Using the visible Decision Date range and recognizing the resulting Current Search Filters entry.",
    evidenceStatus: "screenshot-observation",
    teachingItems: [dateGuide],
    videoPlanId: "contextual-openlaw-decision-date",
  },
  {
    id: "openlaw-sort-order",
    toolId: "openlaw",
    description:
      "Using the visible results sort menu with oldest-to-recent, recent-to-oldest, and title order options.",
    evidenceStatus: "screenshot-observation",
    teachingItems: [sortGuide],
    videoPlanId: "contextual-openlaw-sort-order",
  },
] as const;

export const getSupportTopic = (
  supportTopicId: string | null | undefined,
): SupportTopic | undefined =>
  SUPPORT_TOPICS.find((topic) => topic.id === supportTopicId);

export const getInitialTeachingItems = (
  toolIds: readonly ToolId[],
): ScreenshotGuide[] =>
  toolIds.includes("openlaw") ? [searchGuide] : [];

export const getSupportTopicInventory = (
  toolIds: readonly ToolId[],
): string =>
  SUPPORT_TOPICS.filter((topic) => toolIds.includes(topic.toolId))
    .map(
      (topic) =>
        `- ${topic.id}: ${topic.description} Evidence: ${topic.evidenceStatus}.`,
    )
    .join("\n");
