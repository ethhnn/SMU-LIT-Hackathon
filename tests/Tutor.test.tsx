import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Tutor } from "@/components/Tutor";
import { TOOL_CATALOG } from "@/lib/catalog";

const openlaw = TOOL_CATALOG.find((tool) => tool.id === "openlaw")!;
const litera = TOOL_CATALOG.find((tool) => tool.id === "litera-compare")!;
const imanage = TOOL_CATALOG.find((tool) => tool.id === "imanage")!;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const recommendations = [
  { tool: litera, reason: "Litera Compare fits the comparison objective." },
  { tool: imanage, reason: "iManage fits the organization objective." },
  { tool: openlaw, reason: "OpenLaw fits the judgment-location objective." },
];

const searchGuide = {
  id: "openlaw-search-field-guide",
  toolId: "openlaw",
  toolName: "OpenLaw",
  title: "Locate the search field",
  instruction: "Use the Search field in the left panel.",
  expectedResult: "The Search field is identified.",
  screenshot: "/assets/openlaw/openlaw-search-start.png",
  sourceWidth: 2047,
  sourceHeight: 1069,
  highlight: { x: 351, y: 214, width: 329, height: 60 },
  caption: "Start in the Search field on the left.",
  evidenceStatus: "reviewed-instruction",
};

const unavailableGuidance = {
  message: "The selected tools can be explained at a high level.",
  teachingItems: [searchGuide],
  canGenerateHelpClip: false,
  missingCoverage: ["Litera Compare needs reviewed screenshots."],
};

const openLawGuidance = {
  message: "A reviewed shared Help Clip is available for this exact selection.",
  teachingItems: [searchGuide],
  canGenerateHelpClip: true,
  lessonPlanId: "openlaw-locate-search-field",
  supportTopicId: "openlaw-search-field",
  helpClipToken: "controlled-test-token",
  missingCoverage: [],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Tutor shared Help Clip seam", () => {
  it("renders recommendation checkboxes, preserves their order, and removes Explore buttons", async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url === "/api/recommend") {
        return json({ source: "openrouter", recommendations });
      }

      const request = JSON.parse(String(init?.body));
      return json(
        request.toolIds.length === 1 && request.toolIds[0] === "openlaw"
          ? openLawGuidance
          : unavailableGuidance,
      );
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<Tutor />);

    await user.click(screen.getByRole("button", { name: "Combined task" }));
    await screen.findByRole("heading", { name: /1\. Litera Compare/ });

    expect(screen.getAllByRole("checkbox", { name: "Include in shared Help Clip" })).toHaveLength(3);
    expect(screen.queryByRole("button", { name: /Explore/i })).not.toBeInTheDocument();

    await user.click(screen.getAllByRole("checkbox", { name: "Include in shared Help Clip" })[0]);
    expect(screen.getByText("1 tool selected")).toBeVisible();

    await user.click(screen.getAllByRole("checkbox", { name: "Include in shared Help Clip" })[2]);
    expect(screen.getByText("2 tools selected")).toBeVisible();
    const guidanceRequests = fetchMock.mock.calls.filter(([url]) => url === "/api/guidance");
    expect(JSON.parse(String(guidanceRequests.at(-1)?.[1]?.body)).toolIds).toEqual([
      "litera-compare",
      "openlaw",
    ]);

    await user.click(screen.getAllByRole("checkbox", { name: "Include in shared Help Clip" })[0]);
    expect(await screen.findByText("1 tool selected")).toBeVisible();
  });

  it("keeps the contextual composer available without checked tools", async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url === "/api/recommend") {
        return json({ source: "openrouter", recommendations });
      }
      if (url === "/api/contextual-question") {
        const request = JSON.parse(String(init?.body));
        return json({
          turnId: "turn-no-selection",
          question: request.question,
          answer: "Use the visible sort menu above the OpenLaw judgment list.",
          groundingStatus: "screenshot-observation",
          teachingItems: [searchGuide],
          canGenerateHelpClip: true,
          lessonPlanId: "contextual-openlaw-sort-order",
          supportTopicId: "openlaw-sort-order",
          resolvedToolIds: ["openlaw"],
          helpClipToken: "question-token",
          missingCoverage: [],
        });
      }
      return json({ error: "Unexpected request" }, 500);
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<Tutor />);

    await user.click(screen.getByRole("button", { name: "Combined task" }));
    const input = await screen.findByLabelText("Ask your next question");
    expect(
      screen.getByText(/No tools are checked, so the recommended tools are used as context/i),
    ).toBeVisible();

    await user.type(input, "How can I sort the judgments from oldest to newest?");
    await user.click(screen.getByRole("button", { name: "Ask" }));
    expect(await screen.findByText(/visible sort menu/i)).toBeVisible();

    const request = JSON.parse(
      String(
        fetchMock.mock.calls.find(([url]) => url === "/api/contextual-question")?.[1]
          ?.body,
      ),
    );
    expect(request.toolIds).toEqual(["litera-compare", "imanage", "openlaw"]);
  });

  it("clears the shared selection when a new scenario is submitted", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url === "/api/recommend") {
        return json({ source: "openrouter", recommendations: [{ tool: openlaw, reason: "Matches." }] });
      }
      return json(openLawGuidance);
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<Tutor />);

    await user.click(screen.getByRole("button", { name: "Find a judgment" }));
    await screen.findByRole("checkbox", { name: "Include in shared Help Clip" });
    await user.click(screen.getByRole("checkbox", { name: "Include in shared Help Clip" }));
    await screen.findByText("1 tool selected");

    await user.clear(screen.getByLabelText("Describe your generic training objective"));
    await user.type(
      screen.getByLabelText("Describe your generic training objective"),
      "I need to compare document versions.",
    );
    await user.click(screen.getByRole("button", { name: "Recommend tools" }));
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: "Create one tutorial clip" })).not.toBeInTheDocument(),
    );
  });

  it("places one explicit shared-video request above the selected-tools question and retries failures", async () => {
    let helpClipAttempts = 0;
    const fetchMock = vi.fn(async (url: string) => {
      if (url === "/api/recommend") {
        return json({ source: "openrouter", recommendations: [{ tool: openlaw, reason: "Matches." }] });
      }
      if (url === "/api/guidance") {
        return json(openLawGuidance);
      }
      if (url === "/api/help-clip") {
        helpClipAttempts += 1;
        return helpClipAttempts === 1
          ? json({ error: "Narration audio could not be generated." }, 500)
          : json({
              videoUrl: "/generated/test.mp4",
              narration: "Reviewed narration.",
              label: "Training demonstration",
            });
      }
      return json({ error: "Unexpected request" }, 500);
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<Tutor />);

    await user.click(screen.getByRole("button", { name: "Find a judgment" }));
    await screen.findByRole("checkbox", { name: "Include in shared Help Clip" });
    await user.click(screen.getByRole("checkbox", { name: "Include in shared Help Clip" }));
    const generateButton = await screen.findByRole("button", {
      name: "Generate shared Help Clip",
    });
    expect(screen.getByRole("img", { name: "OpenLaw: Locate the search field" })).toBeVisible();
    const questionLabel = screen.getByLabelText("Ask your next question");
    expect(generateButton.compareDocumentPosition(questionLabel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(fetchMock.mock.calls.some(([url]) => url === "/api/help-clip")).toBe(false);

    await user.click(generateButton);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Narration audio could not be generated.",
    );
    await user.click(screen.getByRole("button", { name: "Retry video" }));
    await waitFor(() =>
      expect(screen.getByLabelText("Generated shared Help Clip")).toBeInTheDocument(),
    );
    const video = screen.getByLabelText("Generated shared Help Clip");
    const questionInput = screen.getByLabelText("Ask your next question");
    expect(video.compareDocumentPosition(questionInput) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(helpClipAttempts).toBe(2);
  });

  it("keeps an uncovered multi-tool selection out of video generation and sends grouped questions", async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url === "/api/recommend") {
        return json({ source: "openrouter", recommendations });
      }
      if (url === "/api/contextual-question") {
        const request = JSON.parse(String(init?.body));
        return json({
          turnId: "turn-1",
          question: request.question,
          answer: "The selected tools have separate curated roles.",
          groundingStatus: "coverage-limit",
          teachingItems: [],
          canGenerateHelpClip: false,
          resolvedToolIds: request.toolIds,
          missingCoverage: ["No reviewed screenshot matches this question yet."],
        });
      }
      return json(unavailableGuidance);
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<Tutor />);

    await user.click(screen.getByRole("button", { name: "Combined task" }));
    await waitFor(() =>
      expect(screen.getAllByRole("checkbox", { name: "Include in shared Help Clip" })).toHaveLength(3),
    );
    const checkboxes = screen.getAllByRole("checkbox", { name: "Include in shared Help Clip" });
    await user.click(checkboxes[0]);
    await user.click(checkboxes[2]);

    expect(await screen.findByText("Litera Compare needs reviewed screenshots.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Shared Help Clip coverage pending" })).toBeDisabled();
    await user.type(
      screen.getByLabelText("Ask your next question"),
      "How do these tools support the exercise?",
    );
    await user.click(screen.getByRole("button", { name: "Ask" }));
    await waitFor(() => {
      const questionRequests = fetchMock.mock.calls.filter(
        ([url]) => url === "/api/contextual-question",
      );
      expect(JSON.parse(String(questionRequests.at(-1)?.[1]?.body))).toMatchObject({
        toolIds: ["litera-compare", "openlaw"],
        question: "How do these tools support the exercise?",
      });
    });
    expect(await screen.findByText("The selected tools have separate curated roles.")).toBeVisible();
    expect(fetchMock.mock.calls.some(([url]) => url === "/api/help-clip")).toBe(false);
  });

  it("appends direct contextual teaching turns with their own screenshot and media state", async () => {
    let turnNumber = 0;
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url === "/api/recommend") {
        return json({ source: "openrouter", recommendations: [{ tool: openlaw, reason: "Matches." }] });
      }
      if (url === "/api/guidance") {
        return json(openLawGuidance);
      }
      if (url === "/api/contextual-question") {
        turnNumber += 1;
        const request = JSON.parse(String(init?.body));
        return json({
          turnId: `turn-${turnNumber}`,
          question: request.question,
          answer:
            turnNumber === 1
              ? "The Decision Date range is in the left panel. Set the lower year to 2000."
              : "Use the reviewed Search field in the left panel.",
          groundingStatus:
            turnNumber === 1 ? "screenshot-observation" : "reviewed-instruction",
          teachingItems: [searchGuide],
          canGenerateHelpClip: true,
          lessonPlanId:
            turnNumber === 2
              ? "openlaw-locate-search-field"
              : "contextual-openlaw-decision-date",
          supportTopicId: turnNumber === 2 ? "openlaw-search-field" : "openlaw-decision-date",
          resolvedToolIds: ["openlaw"],
          helpClipToken: "turn-token",
          missingCoverage: [],
        });
      }
      if (url === "/api/help-clip") {
        return json({
          videoUrl: "/generated/turn.mp4",
          narration: "Question-focused reviewed narration.",
          label: "Training demonstration",
        });
      }
      return json({ error: "Unexpected request" }, 500);
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<Tutor />);

    await user.click(screen.getByRole("button", { name: "Find a judgment" }));
    await user.click(await screen.findByRole("checkbox", { name: "Include in shared Help Clip" }));
    const input = screen.getByLabelText("Ask your next question");
    await user.type(input, "How do I filter cases from 2000 onwards?");
    await user.click(screen.getByRole("button", { name: "Ask" }));

    expect(await screen.findByText(/Set the lower year to 2000/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Generate Help Clip for this answer" })).toBeEnabled();

    await user.type(input, "Where is the search field?");
    await user.click(screen.getByRole("button", { name: "Ask" }));
    expect(await screen.findByText("Use the reviewed Search field in the left panel.")).toBeVisible();
    await user.click(
      screen.getAllByRole("button", { name: "Generate Help Clip for this answer" }).at(-1)!,
    );
    expect(await screen.findByLabelText("Generated shared Help Clip")).toBeVisible();
    expect(screen.getByText("How do I filter cases from 2000 onwards?")).toBeVisible();

    const questionRequests = fetchMock.mock.calls.filter(
      ([url]) => url === "/api/contextual-question",
    );
    const secondRequest = JSON.parse(String(questionRequests[1]?.[1]?.body));
    expect(secondRequest.history).toEqual([
      { role: "user", content: "How do I filter cases from 2000 onwards?" },
      {
        role: "assistant",
        content: "The Decision Date range is in the left panel. Set the lower year to 2000.",
      },
    ]);

    for (const laterQuestion of ["Third question", "Fourth question"]) {
      await user.type(input, laterQuestion);
      await user.click(screen.getByRole("button", { name: "Ask" }));
      await waitFor(() => {
        const requests = fetchMock.mock.calls.filter(
          ([url]) => url === "/api/contextual-question",
        );
        expect(requests).toHaveLength(laterQuestion === "Third question" ? 3 : 4);
      });
    }

    const allQuestionRequests = fetchMock.mock.calls.filter(
      ([url]) => url === "/api/contextual-question",
    );
    const fourthRequest = JSON.parse(String(allQuestionRequests[3]?.[1]?.body));
    expect(fourthRequest.history).toHaveLength(6);
    expect(fourthRequest.history[0]).toEqual({
      role: "user",
      content: "How do I filter cases from 2000 onwards?",
    });
  });
});
