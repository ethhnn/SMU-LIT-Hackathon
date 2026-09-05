import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getContextualHistoryMessageLimit,
  getContextualQuestionWindow,
} from "@/lib/context-window";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("contextual memory window", () => {
  it("keeps three complete question-and-answer turns from configuration", () => {
    vi.stubEnv("NEXT_PUBLIC_CONTEXTUAL_QUESTION_WINDOW", "3");

    expect(getContextualQuestionWindow()).toBe(3);
    expect(getContextualHistoryMessageLimit()).toBe(6);
  });

  it("falls back safely for invalid values", () => {
    vi.stubEnv("NEXT_PUBLIC_CONTEXTUAL_QUESTION_WINDOW", "invalid");
    expect(getContextualQuestionWindow()).toBe(3);
  });
});
