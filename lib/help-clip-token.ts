import {
  createHash,
  createHmac,
  timingSafeEqual,
} from "node:crypto";

import type { DynamicScreenshotScene } from "@/lib/dynamic-scene";

const tokenSecret =
  process.env.HELP_CLIP_TOKEN_SECRET?.trim() ||
  process.env.OPENROUTER_API_KEY?.trim() ||
  process.env.OPENAI_API_KEY?.trim() ||
  "local-only-help-clip-token-secret";
const tokenLifetimeMs = 10 * 60 * 1000;

export type HelpClipTokenPayload = {
  lessonPlanId: string;
  supportTopicId: string;
  expiresAt: number;
  scenarioHash: string;
  toolSelectionHash: string;
  questionHash: string;
  dynamicScene?: DynamicScreenshotScene;
};

const encode = (value: string): string => Buffer.from(value).toString("base64url");

const scenarioHash = (scenario: string): string =>
  createHash("sha256").update(scenario).digest("hex");

const questionHash = (question: string | undefined): string =>
  createHash("sha256").update(question?.trim() || "").digest("hex");

const toolSelectionHash = (toolIds: readonly string[]): string =>
  createHash("sha256")
    .update([...toolIds].sort().join(","))
    .digest("hex");

const sign = (encodedPayload: string): string =>
  createHmac("sha256", tokenSecret).update(encodedPayload).digest("base64url");

export const issueHelpClipToken = ({
  scenario,
  lessonPlanId,
  supportTopicId,
  toolIds,
  question,
  dynamicScene,
}: {
  scenario: string;
  lessonPlanId: string;
  supportTopicId: string;
  toolIds: readonly string[];
  question?: string;
  dynamicScene?: DynamicScreenshotScene;
}): string => {
  const payload: HelpClipTokenPayload = {
    lessonPlanId,
    supportTopicId,
    expiresAt: Date.now() + tokenLifetimeMs,
    scenarioHash: scenarioHash(scenario),
    toolSelectionHash: toolSelectionHash(toolIds),
    questionHash: questionHash(question),
    dynamicScene,
  };
  const encodedPayload = encode(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
};

export const readValidHelpClipToken = ({
  token,
  scenario,
  lessonPlanId,
  supportTopicId,
  toolIds,
  question,
}: {
  token: string;
  scenario: string;
  lessonPlanId: string;
  supportTopicId: string;
  toolIds: readonly string[];
  question?: string;
}): HelpClipTokenPayload | null => {
  const [encodedPayload, signature, ...rest] = token.split(".");
  if (!encodedPayload || !signature || rest.length > 0) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as HelpClipTokenPayload;

    const valid =
      payload.lessonPlanId === lessonPlanId &&
      payload.supportTopicId === supportTopicId &&
      payload.scenarioHash === scenarioHash(scenario) &&
      payload.toolSelectionHash === toolSelectionHash(toolIds) &&
      payload.questionHash === questionHash(question) &&
      Number.isFinite(payload.expiresAt) &&
      payload.expiresAt > Date.now();
    return valid ? payload : null;
  } catch {
    return null;
  }
};

export const hasValidHelpClipToken = (
  input: Parameters<typeof readValidHelpClipToken>[0],
): boolean => Boolean(readValidHelpClipToken(input));
