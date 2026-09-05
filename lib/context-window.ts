const DEFAULT_CONTEXTUAL_QUESTION_WINDOW = 3;
const MAX_CONTEXTUAL_QUESTION_WINDOW = 10;

export const getContextualQuestionWindow = (): number => {
  const configured = Number(
    process.env.NEXT_PUBLIC_CONTEXTUAL_QUESTION_WINDOW ||
      DEFAULT_CONTEXTUAL_QUESTION_WINDOW,
  );

  if (!Number.isInteger(configured) || configured < 1) {
    return DEFAULT_CONTEXTUAL_QUESTION_WINDOW;
  }

  return Math.min(configured, MAX_CONTEXTUAL_QUESTION_WINDOW);
};

export const getContextualHistoryMessageLimit = (): number =>
  getContextualQuestionWindow() * 2;
