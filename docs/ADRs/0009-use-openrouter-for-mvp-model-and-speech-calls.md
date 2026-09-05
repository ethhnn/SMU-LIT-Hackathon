---
status: accepted
---

# Use OpenRouter for MVP model and speech calls

The hackathon provides an OpenRouter team API key. The application must send that key to OpenRouter's OpenAI-compatible API base URL, rather than directly to OpenAI. Use OpenRouter for scenario recommendation, bounded supporting-style selection, and text-to-speech audio.

The OpenAI TypeScript SDK remains the HTTP client because OpenRouter documents compatible Responses, chat-completions, and audio-speech endpoints. Configuration is `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `OPENROUTER_TTS_MODEL`, and `OPENROUTER_TTS_VOICE`. The default speech model is OpenRouter's currently available free `deepgram/flux-tts:free` with voice `flux-bree-en`; both remain configurable because provider availability and cost can vary.

This is a provider-routing decision only. Reviewed core instructions, tutorial coverage, explicit video requests, and the Remotion/FFmpeg rendering path remain unchanged. The prior `OPENAI_API_KEY` name is read only as a local migration alias so an already-created uncommitted `.env` does not need its secret printed or copied; new setup uses `OPENROUTER_API_KEY`.
