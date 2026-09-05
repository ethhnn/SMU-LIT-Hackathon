import { NextResponse } from "next/server";

import { helpClipRequestSchema } from "@/lib/contracts";
import { isToolId } from "@/lib/catalog";
import { readValidHelpClipToken } from "@/lib/help-clip-token";
import {
  getLessonPlanForDynamicScene,
  getLessonPlanForSupportTopic,
  selectionKey,
} from "@/lib/lesson-plans";
import { getSupportTopic } from "@/lib/support-topics";
import { HelpClipError, createHelpClip } from "@/lib/video";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = helpClipRequestSchema.safeParse(body);

    if (!parsed.success || !parsed.data.toolIds.every(isToolId)) {
      return NextResponse.json(
        {
          error:
            "A shared Help Clip requires one to three selected catalog tools and a reviewed Lesson Plan.",
        },
        { status: 400 },
      );
    }
    const toolIds = parsed.data.toolIds.filter(isToolId);

    const tokenPayload = readValidHelpClipToken({
      token: parsed.data.guidanceToken,
      scenario: parsed.data.scenario,
      lessonPlanId: parsed.data.lessonPlanId,
      supportTopicId: parsed.data.supportTopicId,
      toolIds,
      question: parsed.data.question,
    });
    if (!tokenPayload) {
      return NextResponse.json(
        {
          error:
            "Refresh shared contextual help before generating this grounded Help Clip.",
        },
        { status: 400 },
      );
    }

    const lessonPlan = tokenPayload.dynamicScene
      ? getLessonPlanForDynamicScene(
          parsed.data.lessonPlanId,
          tokenPayload.dynamicScene,
        )
      : getLessonPlanForSupportTopic(parsed.data.supportTopicId);
    const supportTopic = tokenPayload.dynamicScene
      ? undefined
      : getSupportTopic(parsed.data.supportTopicId);
    if (
      !lessonPlan ||
      lessonPlan.id !== parsed.data.lessonPlanId ||
      (!tokenPayload.dynamicScene && supportTopic?.videoPlanId !== lessonPlan.id) ||
      (tokenPayload.dynamicScene &&
        parsed.data.supportTopicId !==
          `screenshot:${tokenPayload.dynamicScene.screenshotAssetId}`) ||
      selectionKey(lessonPlan.toolIds) !== selectionKey(toolIds)
    ) {
      return NextResponse.json(
        {
          error:
            "The selected tools do not yet have a reviewed shared Lesson Plan.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      await createHelpClip({ ...parsed.data, toolIds, lessonPlan }),
    );
  } catch (error) {
    const message =
      error instanceof HelpClipError
        ? error.message
        : "The Help Clip could not be generated. Please retry.";

    return NextResponse.json(
      { error: message },
      { status: error instanceof HelpClipError ? error.status : 500 },
    );
  }
}
