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
import { POST as guidancePost } from "@/app/api/guidance/route";

const scenario =
  "I would like to research fair workplace practices and related public judgments.";

const requestFor = (body: unknown) =>
  new Request("http://localhost/api/contextual-question", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const visualDecision = (overrides: Record<string, unknown> = {}) => {
  const {
    answer = "Use the control shown in the supplied screenshot.",
    imageCanAnswer = true,
    ...stepOverrides
  } = overrides;
  return {
    answer,
    imageCanAnswer,
    steps: imageCanAnswer
      ? [
          {
            screenshotId: "openlaw-lawnet-openlaw-judgments-sort-menu",
            title: "Change the judgment sort order",
            instruction: "Open the sort menu and choose Date: Oldest to Recent.",
            expectedResult: "The oldest-to-recent option is visible in the sort menu.",
            caption:
              "The supplied screenshot shows the available result ordering options.",
            highlight: { x: 0.78, y: 0.1, width: 0.18, height: 0.22 },
            ...stepOverrides,
          },
        ]
      : [],
  };
};

const mockScreenshotFlow = (
  screenshotIds: string[],
  decision: Record<string, unknown>,
) => {
  createCompletion.mockImplementation(async (request) => {
    const system = String(request.messages[0]?.content);
    const payload = system.includes("Select up to six screenshot IDs")
      ? { screenshotIds }
      : system.includes("Locate exactly")
        ? {
            targetVisible: true,
            targetDescription: "The instruction's visible target",
            confidence: 0.95,
            highlight: { x: 100, y: 100, width: 200, height: 100 },
          }
        : system.includes("Independently validate a proposed training highlight")
          ? {
              confirmed: true,
              confidence: 0.95,
              reason: "The rectangle encloses the named visible target.",
            }
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
    expect(keywordPrompt).toContain("reference=");
    expect(keywordPrompt).toContain("Legal Resources");
    const visionContent = createCompletion.mock.calls[1][0].messages[1].content;
    expect(visionContent.some((part: { type: string }) => part.type === "image_url")).toBe(true);
    const referencePart = visionContent.find(
      (part: { type: string; text?: string }) =>
        part.type === "text" &&
        part.text?.includes(`Screenshot ID: ${screenshotId}`),
    );
    expect(referencePart?.text).toContain("Website/product: OpenLaw");
    expect(referencePart?.text).toContain("Legal Resources");
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
      steps: [],
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

  it("returns an ordered access-and-destination screenshot sequence when both are relevant", async () => {
    const accessId = "tafep-tafep-homepage-workplace-fairness-act";
    const destinationId = "tafep-tafep-workplace-fairness-overview";
    mockScreenshotFlow([accessId, destinationId], {
      answer:
        "First open Workplace Fairness from the header, then choose the relevant guide inside the overview.",
      imageCanAnswer: true,
      steps: [
        {
          screenshotId: accessId,
          title: "Open Workplace Fairness",
          instruction: "Select Workplace Fairness in the header.",
          expectedResult: "The Workplace Fairness navigation link is visible.",
          caption: "Use the header to reach Workplace Fairness.",
          highlight: { x: 0.55, y: 0.02, width: 0.16, height: 0.08 },
        },
        {
          screenshotId: destinationId,
          title: "Use the Workplace Fairness overview",
          instruction: "Choose the guide that matches the workplace issue.",
          expectedResult: "The available Workplace Fairness guidance is visible.",
          caption: "Continue with the relevant guide inside the destination page.",
          highlight: { x: 0.2, y: 0.35, width: 0.55, height: 0.4 },
        },
      ],
    });

    const response = await POST(
      requestFor({
        scenario: "Learn how to use TAFEP workplace fairness resources.",
        toolIds: ["tafep"],
        question: "Explain what is inside Workplace Fairness and how to access it.",
        history: [],
        priorScreenshotIds: [accessId],
      }),
    );
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.teachingItems).toHaveLength(2);
    expect(result.teachingItems.map((item: { screenshotAssetId: string }) => item.screenshotAssetId)).toEqual([
      accessId,
      destinationId,
    ]);
    expect(result.canGenerateHelpClip).toBe(true);
    expect(result.helpClipToken).toEqual(expect.any(String));
    const shortlistPrompt = createCompletion.mock.calls[0][0].messages[1].content;
    expect(shortlistPrompt).toContain(`Previously shown screenshot IDs:\n${accessId}`);
  });

  it("reserves a homepage candidate and requires it to lead initial teaching", async () => {
    const homepageId = "tafep-tafep-homepage-workplace-fairness-act";
    const insideId = "tafep-tafep-being-fair-fair-employment-practices-01";
    mockScreenshotFlow([insideId], {
      answer:
        "Begin on the TAFEP homepage, then continue to the fair-employment guidance.",
      imageCanAnswer: true,
      steps: [
        {
          screenshotId: homepageId,
          title: "Open workplace fairness from the TAFEP homepage",
          instruction:
            "Select the visible Workplace Fairness Act call-to-action on the homepage.",
          expectedResult:
            "The homepage visibly provides an entry to Workplace Fairness Act information.",
          caption: "Start from the supplied TAFEP homepage.",
          highlight: { x: 0.3, y: 0.25, width: 0.4, height: 0.2 },
        },
      ],
    });

    const response = await guidancePost(
      requestFor({
        scenario:
          "Research fair workplace practices, related legislation, and where updates are published.",
        toolIds: ["tafep"],
      }),
    );
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.teachingItems[0].screenshotAssetId).toBe(homepageId);
    const shortlistSystem = String(createCompletion.mock.calls[0][0].messages[0].content);
    expect(shortlistSystem).toMatch(/initial teaching answer/i);
    const visionSystem = String(createCompletion.mock.calls[1][0].messages[0].content);
    expect(visionSystem).toMatch(/first scene must use that exact entry image/i);
    const visionContent = createCompletion.mock.calls[1][0].messages[1].content;
    expect(
      visionContent.some(
        (part: { type: string; text?: string }) =>
          part.type === "text" && part.text?.includes(`Screenshot ID: ${homepageId}`),
      ),
    ).toBe(true);
  });

  it("withholds screenshot and video output when the proposed highlight is not visually confirmed", async () => {
    const screenshotId = "openlaw-lawnet-openlaw-legal-resources-menu";
    const decision = visualDecision({ screenshotId });
    createCompletion.mockImplementation(async (request) => {
      const system = String(request.messages[0]?.content);
      const payload = system.includes("Select up to six screenshot IDs")
        ? { screenshotIds: [screenshotId] }
        : system.includes("Locate exactly")
          ? {
              targetVisible: true,
              targetDescription: "Proposed control",
              confidence: 0.92,
              highlight: { x: 100, y: 100, width: 200, height: 100 },
            }
          : system.includes("Independently validate a proposed training highlight")
            ? {
                confirmed: false,
                confidence: 0.96,
                reason: "The rectangle covers a different control.",
              }
            : decision;
      return { choices: [{ message: { content: JSON.stringify(payload) } }] };
    });

    const response = await POST(
      requestFor({
        scenario,
        toolIds: ["openlaw"],
        question: "Where is Legal Resources?",
        history: [],
      }),
    );
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.teachingItems).toEqual([]);
    expect(result.canGenerateHelpClip).toBe(false);
    expect(result.helpClipToken).toBeUndefined();
  });

  it("uses a corrected highlight only after the correction passes a second validation", async () => {
    const screenshotId = "openlaw-lawnet-openlaw-legal-resources-menu";
    const decision = visualDecision({ screenshotId });
    let validationCalls = 0;
    createCompletion.mockImplementation(async (request) => {
      const system = String(request.messages[0]?.content);
      let payload: Record<string, unknown>;
      if (system.includes("Select up to six screenshot IDs")) {
        payload = { screenshotIds: [screenshotId] };
      } else if (system.includes("Locate exactly")) {
        payload = {
          targetVisible: true,
          targetDescription: "Legal Resources menu",
          confidence: 0.95,
          highlight: { x: 50, y: 50, width: 100, height: 80 },
        };
      } else if (system.includes("Independently validate a proposed training highlight")) {
        validationCalls += 1;
        payload = validationCalls === 1
          ? {
              confirmed: false,
              confidence: 0.94,
              reason: "The first rectangle is too small.",
              correctedHighlight: { x: 100, y: 100, width: 300, height: 200 },
            }
          : {
              confirmed: true,
              confidence: 0.96,
              reason: "The corrected rectangle tightly encloses the target.",
              correctedHighlight: null,
            };
      } else {
        payload = decision;
      }
      return { choices: [{ message: { content: JSON.stringify(payload) } }] };
    });

    const response = await POST(
      requestFor({
        scenario,
        toolIds: ["openlaw"],
        question: "Where is Legal Resources?",
        history: [],
      }),
    );
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(validationCalls).toBe(2);
    expect(result.teachingItems).toHaveLength(1);
    expect(result.canGenerateHelpClip).toBe(true);
    expect(result.teachingItems[0].highlight.width).toBeGreaterThan(
      result.teachingItems[0].highlight.height,
    );
  });

  it("reports an OpenRouter connection failure instead of missing screenshot coverage", async () => {
    createCompletion.mockRejectedValue(new Error("Connection error: EACCES"));

    const response = await guidancePost(
      requestFor({
        scenario,
        toolIds: ["openlaw"],
      }),
    );
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.message).toMatch(/could not connect to OpenRouter/i);
    expect(result.message).not.toMatch(/no supplied screenshot was confirmed/i);
    expect(result.canGenerateHelpClip).toBe(false);
  });
});
