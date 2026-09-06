export const TOOL_IDS = [
  "openlaw",
  "tafep",
  "judiciary",
] as const;

export type ToolId = (typeof TOOL_IDS)[number];

export type TutorialCoverage = "partial" | "not-yet";

export type CatalogTool = {
  id: ToolId;
  name: string;
  intendedUse: string;
  capabilities: string[];
  pros: string[];
  cons: string[];
  tutorialCoverage: TutorialCoverage;
  coverageLabel: string;
};

export const TOOL_CATALOG: readonly CatalogTool[] = [
  {
    id: "tafep",
    name: "TAFEP",
    intendedUse:
      "Find guidance, resources, and updates on fair and progressive employment practices in Singapore.",
    capabilities: [
      "workplace fairness",
      "employment practices",
      "tripartite guidelines",
      "workplace resources",
      "Workplace Fairness Act",
    ],
    pros: [
      "Focused resources for fair and progressive employment practices",
      "Includes workplace-fairness guidance, events, media, and resource search",
    ],
    cons: [
      "Guidance content is different from legislation and court judgments",
      "The prototype uses supplied screenshots and does not inspect the live site",
    ],
    tutorialCoverage: "partial",
    coverageLabel: "Screenshot-guided Help Clips available",
  },
  {
    id: "openlaw",
    name: "OpenLaw",
    intendedUse: "Find and review public Singapore Supreme Court judgments.",
    capabilities: ["judgment research", "case search", "Singapore judgments"],
    pros: [
      "Public access to Singapore Supreme Court judgments",
      "Useful for locating and reviewing original judgments",
    ],
    cons: [
      "Focused on public judgments",
      "Does not provide every LawNet research capability",
    ],
    tutorialCoverage: "partial",
    coverageLabel: "Help Clip available: locate the search field",
  },
  {
    id: "judiciary",
    name: "Judiciary.gov.sg / SG Courts",
    intendedUse:
      "Find Singapore court information, hearing listings, judgments, self-help guides, and court services.",
    capabilities: [
      "hearing search",
      "court judgments",
      "court services",
      "self-help court guides",
      "Sheriff's sales",
    ],
    pros: [
      "Official directory for Singapore court information and services",
      "Supplied screenshots cover hearing filters, judgments, services, and court guides",
    ],
    cons: [
      "The prototype uses supplied screenshots and does not inspect the live site",
      "Screenshot observations do not verify that a court transaction was completed",
    ],
    tutorialCoverage: "partial",
    coverageLabel: "Screenshot-guided Help Clips available",
  },
] as const;

export const getCatalogTool = (toolId: string): CatalogTool | undefined =>
  TOOL_CATALOG.find((tool) => tool.id === toolId);

export const isToolId = (value: string): value is ToolId =>
  TOOL_IDS.some((toolId) => toolId === value);
