import { randomUUID } from "node:crypto";

import type { ToolId } from "@/lib/catalog";
import type {
  ContextualQuestionResponse,
  QuestionHistoryMessage,
} from "@/lib/contracts";
import {
  getDynamicLessonPlanId,
  getDynamicSupportTopicId,
  type DynamicScreenshotScene,
} from "@/lib/dynamic-scene";
import { answerWithScreenshotLibraryPerTool } from "@/lib/screenshot-assistant";

type ContextualQuestionInput = {
  scenario: string;
  toolIds: ToolId[];
  question: string;
  history: QuestionHistoryMessage[];
  priorScreenshotIds: string[];
};

export type ContextualQuestionResult = {
  response: ContextualQuestionResponse;
  dynamicScenes?: DynamicScreenshotScene[];
};

export const answerContextualQuestion = async (
  input: ContextualQuestionInput,
): Promise<ContextualQuestionResult> => {
  const result = await answerWithScreenshotLibraryPerTool(input);
  const supportTopicId = result.scenes.length > 0
    ? getDynamicSupportTopicId(result.scenes)
    : undefined;
  const lessonPlanId = result.scenes.length > 0
    ? getDynamicLessonPlanId(result.scenes)
    : undefined;

  return {
    response: {
      turnId: randomUUID(),
      question: input.question,
      answer: result.answer,
      groundingStatus: result.guides.length > 0
        ? "screenshot-observation"
        : "coverage-limit",
      teachingItems: result.guides,
      canGenerateHelpClip: result.scenes.length > 0,
      lessonPlanId,
      supportTopicId,
      resolvedToolIds: result.resolvedToolIds,
      missingCoverage: result.scenes.length > 0
        ? []
        : [
            "No supplied screenshot for the current tools was confirmed as relevant to this question. Video coverage is not available.",
          ],
    },
    dynamicScenes: result.scenes.length > 0 ? result.scenes : undefined,
  };
};
