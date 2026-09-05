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
import {
  getDynamicLessonPlanId,
  getDynamicSupportTopicId,
} from "@/lib/dynamic-scene";

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

  it("accepts an ordered multi-screenshot sequence in one grounded clip", async () => {
    const toolIds = ["tafep"];
    const dynamicScenes = [
      {
        screenshotAssetId: "tafep-tafep-homepage-workplace-fairness-act",
        toolId: "tafep" as const,
        toolName: "TAFEP",
        title: "Open Workplace Fairness",
        instruction: "Select Workplace Fairness in the header.",
        expectedResult: "The navigation link is visible.",
        caption: "Start from the TAFEP header.",
        highlight: { x: 1000, y: 100, width: 220, height: 60 },
      },
      {
        screenshotAssetId: "tafep-tafep-workplace-fairness-overview",
        toolId: "tafep" as const,
        toolName: "TAFEP",
        title: "Use Workplace Fairness",
        instruction: "Choose the relevant Workplace Fairness guide.",
        expectedResult: "The destination guidance cards are visible.",
        caption: "Continue inside Workplace Fairness.",
        highlight: { x: 400, y: 500, width: 500, height: 260 },
      },
    ];
    const lessonPlanId = getDynamicLessonPlanId(dynamicScenes);
    const supportTopicId = getDynamicSupportTopicId(dynamicScenes);
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
          dynamicScenes,
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(createHelpClip).toHaveBeenLastCalledWith(
      expect.objectContaining({
        lessonPlan: expect.objectContaining({
          scenes: [
            expect.objectContaining({
              screenshot: expect.stringContaining("tafep-homepage-workplace-fairness-act.png"),
            }),
            expect.objectContaining({
              screenshot: expect.stringContaining("tafep-workplace-fairness-overview.png"),
            }),
          ],
        }),
      }),
    );
  });

  it("accepts more than three scenes when they are split across selected tools", async () => {
    const toolIds = ["tafep", "openlaw", "judiciary"];
    const scene = (
      screenshotAssetId: string,
      toolId: "tafep" | "openlaw" | "judiciary",
      toolName: string,
    ) => ({
      screenshotAssetId,
      toolId,
      toolName,
      title: `Use ${toolName}`,
      instruction: `Continue through the validated ${toolName} route.`,
      expectedResult: `The next ${toolName} screen is shown.`,
      caption: `A supplied ${toolName} screenshot.`,
      highlight: { x: 40, y: 40, width: 180, height: 80 },
    });
    const dynamicScenes = [
      scene("tafep-tafep-being-fair-fair-employment-practices-01", "tafep", "TAFEP"),
      scene("tafep-tafep-being-fair-fair-employment-practices-02", "tafep", "TAFEP"),
      scene("openlaw-lawnet-academy-library-account-menu", "openlaw", "OpenLaw"),
      scene(
        "judiciary-judiciary-admiralty-actions-arrest-of-vessels",
        "judiciary",
        "Judiciary.gov.sg / SG Courts",
      ),
    ];
    const lessonPlanId = getDynamicLessonPlanId(dynamicScenes);
    const supportTopicId = getDynamicSupportTopicId(dynamicScenes);
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
          dynamicScenes,
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(createHelpClip).toHaveBeenLastCalledWith(
      expect.objectContaining({
        lessonPlan: expect.objectContaining({
          scenes: expect.arrayContaining([
            expect.objectContaining({ toolId: "tafep" }),
            expect.objectContaining({ toolId: "openlaw" }),
            expect.objectContaining({ toolId: "judiciary" }),
          ]),
        }),
      }),
    );
  });

  it("rejects a signed video sequence whose screenshots are not connected", async () => {
    const toolIds = ["tafep"];
    const dynamicScenes = [
      {
        screenshotAssetId: "tafep-tafep-homepage-workplace-fairness-act",
        toolId: "tafep" as const,
        toolName: "TAFEP",
        title: "Start at TAFEP",
        instruction: "Select Workplace Fairness.",
        expectedResult: "Workplace Fairness opens.",
        caption: "TAFEP homepage.",
        highlight: { x: 1000, y: 100, width: 220, height: 60 },
      },
      {
        screenshotAssetId: "tafep-tafep-being-fair-tripartite-guidelines-part-01",
        toolId: "tafep" as const,
        toolName: "TAFEP",
        title: "Disconnected page",
        instruction: "Read the page.",
        expectedResult: "Guidance is visible.",
        caption: "An unrelated destination for this click.",
        highlight: { x: 400, y: 500, width: 500, height: 260 },
      },
    ];
    const lessonPlanId = getDynamicLessonPlanId(dynamicScenes);
    const supportTopicId = getDynamicSupportTopicId(dynamicScenes);

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
          dynamicScenes,
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(/confirmed navigation path/i),
    });
  });
});
