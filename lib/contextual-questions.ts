import { randomUUID } from "node:crypto";

import type { ToolId } from "@/lib/catalog";
import type {
  ContextualQuestionResponse,
  QuestionHistoryMessage,
} from "@/lib/contracts";
import type { DynamicScreenshotScene } from "@/lib/dynamic-scene";
import { answerWithScreenshotLibrary } from "@/lib/screenshot-assistant";

type ContextualQuestionInput = {
  scenario: string;
  toolIds: ToolId[];
  question: string;
  history: QuestionHistoryMessage[];
};

export type ContextualQuestionResult = {
  response: ContextualQuestionResponse;
  dynamicScene?: DynamicScreenshotScene;
};

export const answerContextualQuestion = async (
  input: ContextualQuestionInput,
): Promise<ContextualQuestionResult> => {
  const result = await answerWithScreenshotLibrary(input);
  const supportTopicId = result.scene
    ? `screenshot:${result.scene.screenshotAssetId}`
    : undefined;
  const lessonPlanId = result.scene
    ? `contextual-${result.scene.screenshotAssetId}`
    : undefined;

  return {
    response: {
      turnId: randomUUID(),
      question: input.question,
      answer: result.answer,
      groundingStatus: result.guide
        ? "screenshot-observation"
        : "coverage-limit",
      teachingItems: result.guide ? [result.guide] : [],
      canGenerateHelpClip: Boolean(result.scene),
      lessonPlanId,
      supportTopicId,
      resolvedToolIds: result.resolvedToolIds,
      missingCoverage: result.scene
        ? []
        : [
            "No supplied screenshot for the current tools was confirmed as relevant to this question. Video coverage is not available.",
          ],
    },
    dynamicScene: result.scene,
  };
};
