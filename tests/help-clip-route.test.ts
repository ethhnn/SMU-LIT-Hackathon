import { describe, expect, it, vi } from "vitest";

const { createHelpClip } = vi.hoisted(() => ({
  createHelpClip: vi.fn(async () => ({
    videoUrl: "/generated/test.mp4",
    narration: "Reviewed narration.",
    label: "Training demonstration" as const,
  })),
}));

vi.mock("@/lib/video", () => ({
  HelpClipError: class HelpClipError extends Error {
    status = 500;
  },
  createHelpClip,
}));

import { POST } from "@/app/api/help-clip/route";
import { issueHelpClipToken } from "@/lib/help-clip-token";

const scenario = "I need to locate a public judgment for a training exercise.";

const requestFor = (body: unknown) =>
  new Request("http://localhost/api/help-clip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

describe("shared Help Clip route", () => {
  it("rejects a forged multi-tool selection without a reviewed Lesson Plan", async () => {
    const response = await POST(
      requestFor({
        scenario,
        toolIds: ["openlaw", "litera-compare"],
        lessonPlanId: "openlaw-locate-search-field",
        supportTopicId: "openlaw-search-field",
        guidanceToken: "forged",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(/Refresh shared contextual help/i),
    });
    expect(createHelpClip).not.toHaveBeenCalled();
  });

  it("accepts a token bound to the reviewed OpenLaw-only Lesson Plan", async () => {
    const toolIds = ["openlaw"];
    const lessonPlanId = "openlaw-locate-search-field";
    const supportTopicId = "openlaw-search-field";
    const response = await POST(
      requestFor({
        scenario,
        toolIds,
        lessonPlanId,
        supportTopicId,
        guidanceToken: issueHelpClipToken({
          scenario,
          lessonPlanId,
          supportTopicId,
          toolIds,
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(createHelpClip).toHaveBeenCalledWith(
      expect.objectContaining({ toolIds, lessonPlanId, supportTopicId }),
    );
  });

  it("accepts a question-bound token carrying the AI-selected supplied screenshot", async () => {
    const toolIds = ["openlaw"];
    const screenshotAssetId =
      "openlaw-lawnet-openlaw-legal-resources-menu";
    const lessonPlanId = `contextual-${screenshotAssetId}`;
    const supportTopicId = `screenshot:${screenshotAssetId}`;
    const question = "How do I find Legal Resources?";
    const dynamicScene = {
      screenshotAssetId,
      toolId: "openlaw" as const,
      toolName: "OpenLaw",
      title: "Open Legal Resources",
      instruction: "Select Legal Resources in the left navigation.",
      expectedResult: "The supplied image shows the Legal Resources menu.",
      caption: "Legal Resources navigation in the supplied LawNet screenshot.",
      highlight: { x: 0, y: 80, width: 300, height: 220 },
    };
    const response = await POST(
      requestFor({
        scenario,
        toolIds,
        lessonPlanId,
        supportTopicId,
        question,
        guidanceToken: issueHelpClipToken({
          scenario,
          lessonPlanId,
          supportTopicId,
          toolIds,
          question,
          dynamicScene,
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(createHelpClip).toHaveBeenCalledWith(
      expect.objectContaining({
        toolIds,
        lessonPlanId,
        supportTopicId,
        question,
        lessonPlan: expect.objectContaining({
          id: lessonPlanId,
          scenes: [
            expect.objectContaining({
              screenshot:
                "/assets/screenshots/openlaw/original/lawnet-openlaw-legal-resources-menu.png",
            }),
          ],
        }),
      }),
    );
  });

  it("rejects a token when the contextual question does not match", async () => {
    const toolIds = ["openlaw"];
    const lessonPlanId = "openlaw-locate-search-field";
    const supportTopicId = "openlaw-search-field";
    const response = await POST(
      requestFor({
        scenario,
        toolIds,
        lessonPlanId,
        supportTopicId,
        question: "Where is the search field?",
        guidanceToken: issueHelpClipToken({
          scenario,
          lessonPlanId,
          supportTopicId,
          toolIds,
          question: "A different question",
        }),
      }),
    );

    expect(response.status).toBe(400);
  });
});
