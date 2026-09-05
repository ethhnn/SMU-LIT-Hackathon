import { beforeEach, describe, expect, it, vi } from "vitest";

const { createCompletion } = vi.hoisted(() => ({
  createCompletion: vi.fn(),
}));

vi.mock("@/lib/openrouter", () => ({
  getRecommendationModel: () => "openai/gpt-4o-mini",
  getOpenRouterClient: () => ({
    chat: { completions: { create: createCompletion } },
  }),
}));

import { POST } from "@/app/api/contextual-question/route";

const scenario =
  "I would like to research fair workplace practices and related public judgments.";

const requestFor = (body: unknown) =>
  new Request("http://localhost/api/contextual-question", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const visualDecision = (overrides: Record<string, unknown> = {}) => ({
  answer: "Use the control shown in the supplied screenshot.",
  imageCanAnswer: true,
  screenshotId: "openlaw-lawnet-openlaw-judgments-sort-menu",
  title: "Change the judgment sort order",
  instruction: "Open the sort menu and choose Date: Oldest to Recent.",
  expectedResult: "The oldest-to-recent option is visible in the sort menu.",
  caption: "The supplied screenshot shows the available result ordering options.",
  highlight: { x: 0.78, y: 0.1, width: 0.18, height: 0.22 },
  ...overrides,
});

const mockScreenshotFlow = (
  screenshotIds: string[],
  decision: Record<string, unknown>,
) => {
  createCompletion.mockImplementation(async (request) => {
    const system = String(request.messages[0]?.content);
    const payload = system.includes("Select up to six screenshot IDs")
      ? { screenshotIds }
      : decision;
    return { choices: [{ message: { content: JSON.stringify(payload) } }] };
  });
};

beforeEach(() => {
  createCompletion.mockReset();
});

describe("contextual question route", () => {
  it("searches the complete keyword index and visually selects the relevant screenshot", async () => {
    const screenshotId = "openlaw-lawnet-openlaw-legal-resources-menu";
    mockScreenshotFlow(
      [screenshotId],
      visualDecision({
        answer:
          "Open the Legal Resources menu shown on the left to see the available resources.",
        screenshotId,
        title: "Open Legal Resources",
        instruction: "Select Legal Resources in the left navigation.",
        expectedResult: "The supplied screen shows the Legal Resources menu.",
        caption: "LawNet Legal Resources navigation is visible.",
        highlight: { x: 0, y: 0.08, width: 0.15, height: 0.18 },
      }),
    );

    const response = await POST(
      requestFor({
        scenario: "How can I look for legal resources from LawNet?",
        toolIds: ["openlaw"],
        question: "How can I look for legal resources on LawNet?",
        history: [],
      }),
    );
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.answer).toMatch(/Legal Resources menu/i);
    expect(result.groundingStatus).toBe("screenshot-observation");
    expect(result.teachingItems[0].screenshot).toContain(
      "lawnet-openlaw-legal-resources-menu.png",
    );
    expect(result.canGenerateHelpClip).toBe(true);
    expect(result.resolvedToolIds).toEqual(["openlaw"]);
    expect(result.helpClipToken).toEqual(expect.any(String));

    const keywordPrompt = createCompletion.mock.calls[0][0].messages[1].content;
    expect(keywordPrompt).toContain("Complete screenshot keyword index");
    expect(keywordPrompt).toContain("openlaw-lawnet-openlaw-legal-resources-menu");
    expect(keywordPrompt).toContain("openlaw-lawnet-research-ai-search");
    const visionContent = createCompletion.mock.calls[1][0].messages[1].content;
    expect(visionContent.some((part: { type: string }) => part.type === "image_url")).toBe(true);
  });

  it("uses the latest three Q&A turns to resolve a follow-up question", async () => {
    const screenshotId = "openlaw-lawnet-openlaw-legal-resources-menu";
    mockScreenshotFlow(
      [screenshotId],
      visualDecision({ screenshotId }),
    );
    const history = Array.from({ length: 8 }, (_, index) => ({
      role: index % 2 === 0 ? "user" as const : "assistant" as const,
      content: `message-${index}`,
    }));

    const response = await POST(
      requestFor({
        scenario,
        toolIds: ["openlaw"],
        question: "Where is the first option you mentioned?",
        history,
      }),
    );

    expect(response.status).toBe(200);
    const keywordPrompt = createCompletion.mock.calls[0][0].messages[1].content;
    expect(keywordPrompt).not.toContain("message-0");
    expect(keywordPrompt).not.toContain("message-1");
    expect(keywordPrompt).toContain("message-2");
    expect(keywordPrompt).toContain("message-7");
    const visionPrompt = createCompletion.mock.calls[1][0].messages[1].content[0].text;
    expect(visionPrompt).toContain("message-2");
    expect(visionPrompt).toContain("Current question (answer this question, not an earlier one)");
  });

  it("keeps media unavailable when no supplied screenshot helps", async () => {
    mockScreenshotFlow([], {
      answer:
        "The supplied screenshots do not establish where new Acts are officially published.",
      imageCanAnswer: false,
      screenshotId: null,
      title: null,
      instruction: null,
      expectedResult: null,
      caption: null,
      highlight: null,
    });

    const response = await POST(
      requestFor({
        scenario,
        toolIds: ["openlaw"],
        question: "Where are new Acts officially published?",
        history: [],
      }),
    );
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.groundingStatus).toBe("coverage-limit");
    expect(result.teachingItems).toEqual([]);
    expect(result.canGenerateHelpClip).toBe(false);
    expect(result.helpClipToken).toBeUndefined();
  });

  it("rejects unknown selected tools before calling OpenRouter", async () => {
    const response = await POST(
      requestFor({
        scenario,
        toolIds: ["invented-tool"],
        question: "How do I use it?",
        history: [],
      }),
    );

    expect(response.status).toBe(400);
    expect(createCompletion).not.toHaveBeenCalled();
  });
});
