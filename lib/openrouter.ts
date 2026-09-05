import OpenAI from "openai";

export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

// OPENAI_API_KEY is read only as a local migration alias, so an existing
// hackathon .env continues to work after the provider change. New setup uses
// OPENROUTER_API_KEY exclusively.
export const getOpenRouterApiKey = (): string | undefined =>
  process.env.OPENROUTER_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();

export const hasOpenRouterKey = (): boolean => Boolean(getOpenRouterApiKey());

export const getOpenRouterClient = (): OpenAI | null => {
  const apiKey = getOpenRouterApiKey();
  if (!apiKey) {
    return null;
  }

  return new OpenAI({
    apiKey,
    baseURL: OPENROUTER_BASE_URL,
    defaultHeaders: {
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL?.trim() || "http://localhost:3000",
      "X-Title": "R&T Workflow Tutor",
    },
  });
};

export const getRecommendationModel = (): string =>
  process.env.OPENROUTER_MODEL?.trim() || "openai/gpt-4o-mini";

export const getTtsModel = (): string =>
  process.env.OPENROUTER_TTS_MODEL?.trim() ||
  "deepgram/flux-tts:free";

export const getTtsVoice = (): string =>
  process.env.OPENROUTER_TTS_VOICE?.trim() || "flux-bree-en";
