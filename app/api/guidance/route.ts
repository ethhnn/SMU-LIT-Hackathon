import { NextResponse } from "next/server";

import { sharedGuidanceRequestSchema } from "@/lib/contracts";
import { getSharedGuidance } from "@/lib/guidance";
import { isToolId } from "@/lib/catalog";
import { issueHelpClipToken } from "@/lib/help-clip-token";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = sharedGuidanceRequestSchema.safeParse(body);

    if (!parsed.success || !parsed.data.toolIds.every(isToolId)) {
      return NextResponse.json(
        { error: "Choose one to three catalog tools and keep the training objective non-confidential." },
        { status: 400 },
      );
    }
    const toolIds = parsed.data.toolIds.filter(isToolId);

    const { response: guidance, dynamicScene } = await getSharedGuidance({
      ...parsed.data,
      toolIds,
    });
    const helpClipToken =
      guidance.canGenerateHelpClip &&
      guidance.lessonPlanId &&
      guidance.supportTopicId
        ? issueHelpClipToken({
            scenario: parsed.data.scenario,
            lessonPlanId: guidance.lessonPlanId,
            supportTopicId: guidance.supportTopicId,
            toolIds,
            dynamicScene,
          })
        : undefined;

    return NextResponse.json({ ...guidance, helpClipToken });
  } catch {
    return NextResponse.json(
      { error: "Contextual help is unavailable right now. Please try again." },
      { status: 500 },
    );
  }
}
