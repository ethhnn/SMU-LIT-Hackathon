import { NextResponse } from "next/server";

import { isToolId } from "@/lib/catalog";
import { answerContextualQuestion } from "@/lib/contextual-questions";
import { contextualQuestionRequestSchema } from "@/lib/contracts";
import { getContextualHistoryMessageLimit } from "@/lib/context-window";
import { issueHelpClipToken } from "@/lib/help-clip-token";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = contextualQuestionRequestSchema.safeParse(body);

    if (!parsed.success || !parsed.data.toolIds.every(isToolId)) {
      return NextResponse.json(
        {
          error:
            "Ask a non-confidential question using up to three catalog tools.",
        },
        { status: 400 },
      );
    }
    const toolIds = parsed.data.toolIds.filter(isToolId);
    const { response: result, dynamicScene } = await answerContextualQuestion({
      ...parsed.data,
      toolIds,
      history: parsed.data.history.slice(-getContextualHistoryMessageLimit()),
    });
    const helpClipToken =
      result.canGenerateHelpClip &&
      result.lessonPlanId &&
      result.supportTopicId
        ? issueHelpClipToken({
            scenario: parsed.data.scenario,
            lessonPlanId: result.lessonPlanId,
            supportTopicId: result.supportTopicId,
            toolIds: result.resolvedToolIds,
            question: parsed.data.question,
            dynamicScene,
          })
        : undefined;

    return NextResponse.json({ ...result, helpClipToken });
  } catch {
    return NextResponse.json(
      { error: "The contextual answer is unavailable right now. Please try again." },
      { status: 500 },
    );
  }
}
