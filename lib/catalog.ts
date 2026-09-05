export const TOOL_IDS = [
  "openlaw",
  "tafep",
  "litera-compare",
  "imanage",
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
    id: "litera-compare",
    name: "Litera Compare",
    intendedUse: "Compare document versions and identify changes.",
    capabilities: ["document comparison", "redlining", "contract changes"],
    pros: [
      "Highlights additions and deletions between versions",
      "Useful for reviewing contract changes",
    ],
    cons: [
      "Does not perform legal research",
      "Tutorial assets are not yet added to this prototype",
    ],
    tutorialCoverage: "not-yet",
    coverageLabel: "Tutorial assets not yet added",
  },
  {
    id: "imanage",
    name: "iManage",
    intendedUse: "Organize legal documents and matter-related records.",
    capabilities: ["document management", "matter organization", "version management"],
    pros: [
      "Centralizes legal document management",
      "Supports versioning and matter organization",
    ],
    cons: [
      "Not primarily a legal research or comparison tool",
      "Tutorial assets are not yet added to this prototype",
    ],
    tutorialCoverage: "not-yet",
    coverageLabel: "Tutorial assets not yet added",
  },
] as const;

export const getCatalogTool = (toolId: string): CatalogTool | undefined =>
  TOOL_CATALOG.find((tool) => tool.id === toolId);

export const isToolId = (value: string): value is ToolId =>
  TOOL_IDS.some((toolId) => toolId === value);
