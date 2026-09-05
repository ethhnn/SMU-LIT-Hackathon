---
status: accepted
---

# Generate grounded Help Clips before full tutorials

The MVP will generate on-demand Help Clips using supplied interface states and server-owned Lesson Plans. Narration, captions, timing, and emphasis can adapt to the learner's difficulty, while the visual and operational content remains within the resolved plan. Each clip is labeled "Training demonstration" and carries its evidence status rather than claiming to record the learner's work. Reviewed shared workflows remain distinct from contextual clips based only on screenshot observation.

AI may recommend a Help Clip, but generation still requires the learner's explicit request, as previously agreed; deciding the appropriate assistance format is not permission to generate video automatically. ADR 0010 adds the shared-selection boundary: every requested set requires an exact manually curated Lesson Plan before rendering.

The user's latest clarification establishes the screenshots' primary purpose: source visual scenes for generated audio-video. A working narrated Help Clip is a core prototype deliverable. Standalone screenshot display is supplementary and need not precede a video request; text and still images alone cannot fulfill the demo objective.

The implementation uses an OpenRouter-routed model to choose a permitted supporting emphasis and an OpenRouter TTS model to synthesize narration, with Remotion and FFmpeg for the clip. This preserves the original single media path while using the hackathon-provided OpenRouter team key. Reviewed core instructions remain fixed; curated narration and caption templates prevent unsupported generated operations without a complex narration-validation system. On failure, retain text and the annotated screenshot and offer an explicit retry. Exact clip length and integration details can be resolved during authorized implementation.
