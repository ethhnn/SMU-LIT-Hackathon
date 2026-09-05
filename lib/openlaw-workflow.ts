import type { ToolId } from "@/lib/catalog";

export const OPENLAW_ENTRY_URL =
  "https://www.lawnet.com/openlaw/singapore/judgments/supreme-court";

export const OPENLAW_TRAINING_TARGET = {
  name: "Howe Wen Khong Rocky and others v Attorney-General",
  citation: "[2026] SGCA 39",
  query: '"Howe Wen Khong Rocky and others v Attorney-General"',
  sourceUrl: OPENLAW_ENTRY_URL,
  detailUrl: null as string | null,
};

export type OpenLawActionId =
  | "locate-search-field"
  | "enter-judgment-name"
  | "run-search"
  | "open-matching-judgment";

export type Highlight = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CursorPosition = {
  x: number;
  y: number;
};

export type OpenLawAction = {
  id: OpenLawActionId;
  order: number;
  title: string;
  reviewedCoreInstruction: string | null;
  expectedResult: string | null;
  startingState: string;
  endingState: string;
  screenshot: string | null;
  sourceWidth: number | null;
  sourceHeight: number | null;
  highlight: Highlight | null;
  cursor: CursorPosition | null;
  caption: string;
  tutorialAvailable: boolean;
  assetStatus: "ready" | "pending-capture";
  coverageNote: string;
};

export const OPENLAW_ACTIONS: readonly OpenLawAction[] = [
  {
    id: "locate-search-field",
    order: 1,
    title: "Locate the search field",
    reviewedCoreInstruction:
      "Use the Search field in the left panel of the OpenLaw judgments page.",
    expectedResult:
      "You know where to enter the judgment name in the OpenLaw page.",
    startingState: "S0 — OpenLaw judgments page with a blank Search field",
    endingState: "S0 — same page; the Search field is identified",
    screenshot: "/assets/openlaw/openlaw-search-start.png",
    sourceWidth: 2047,
    sourceHeight: 1069,
    highlight: { x: 351, y: 214, width: 329, height: 60 },
    cursor: { x: 648, y: 243 },
    caption: "Start in the Search field on the left.",
    tutorialAvailable: true,
    assetStatus: "ready",
    coverageNote:
      "Reviewed screenshot and instruction are available for this action.",
  },
  {
    id: "enter-judgment-name",
    order: 2,
    title: "Enter the judgment name",
    reviewedCoreInstruction: null,
    expectedResult: null,
    startingState: "S0 — blank Search field",
    endingState: "S1 — populated Search field",
    screenshot: null,
    sourceWidth: null,
    sourceHeight: null,
    highlight: null,
    cursor: null,
    caption: "Asset capture pending.",
    tutorialAvailable: false,
    assetStatus: "pending-capture",
    coverageNote:
      "Training screenshots and manual rehearsal are still pending for this action.",
  },
  {
    id: "run-search",
    order: 3,
    title: "Run the search",
    reviewedCoreInstruction: null,
    expectedResult: null,
    startingState: "S1 — populated Search field",
    endingState: "S2 — search results with the target title and citation",
    screenshot: null,
    sourceWidth: null,
    sourceHeight: null,
    highlight: null,
    cursor: null,
    caption: "Asset capture pending.",
    tutorialAvailable: false,
    assetStatus: "pending-capture",
    coverageNote:
      "Training screenshots and manual rehearsal are still pending for this action.",
  },
  {
    id: "open-matching-judgment",
    order: 4,
    title: "Open the matching judgment",
    reviewedCoreInstruction: null,
    expectedResult: null,
    startingState: "S2 — search results with the target title and citation",
    endingState: "S3 — opened target judgment",
    screenshot: null,
    sourceWidth: null,
    sourceHeight: null,
    highlight: null,
    cursor: null,
    caption: "Asset capture pending.",
    tutorialAvailable: false,
    assetStatus: "pending-capture",
    coverageNote:
      "Training screenshots and manual rehearsal are still pending for this action.",
  },
] as const;

export const getOpenLawAction = (
  actionId: string | null | undefined,
): OpenLawAction | undefined =>
  OPENLAW_ACTIONS.find((action) => action.id === actionId);

export const isTutorialAvailable = (
  toolId: ToolId,
  actionId: string | null | undefined,
): boolean =>
  toolId === "openlaw" && Boolean(getOpenLawAction(actionId)?.tutorialAvailable);
