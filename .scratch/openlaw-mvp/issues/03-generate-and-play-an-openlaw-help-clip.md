# 03 — Generate and play an OpenLaw Help Clip

**What to build:** Milestone two: from contextual OpenLaw guidance, an explicit Help Clip request produces OpenAI supporting narration and TTS, animates reviewed screenshots using Remotion/FFmpeg, and displays a playable narrated MP4.

**Blocked by:**

- [01 — Complete OpenLaw verified training assets](01-complete-openlaw-verified-training-assets.md)
- [02 — Deliver scenario-driven recommendations and contextual help](02-deliver-scenario-driven-recommendations-and-contextual-help.md)

**Status:** ready-for-agent

This ticket remains blocked until both prerequisites are complete; the status does not override these dependencies.

- [ ] Connect contextual Help Focus to the relevant reviewed OpenLaw instruction and assets from ticket 01.
- [ ] Start video generation only after an explicit request or retry for an action with the required verified coverage. Viewing a standalone screenshot is not a prerequisite.
- [ ] Preserve the reviewed core operational instruction while OpenAI adapts supporting narration and captions to the Learner's difficulty.
- [ ] Generate real narration audio using OpenAI TTS and compose the clip with Remotion/FFmpeg using screenshots, highlights, pointer movement, captions, and reviewed expected-state transitions.
- [ ] Display a playable narrated MP4 labeled "Training demonstration." Text or still-image output alone does not satisfy this milestone.
- [ ] Keep reviewed text and screenshot help available if generation fails, explain the failure simply, and offer an explicit retry.
- [ ] Prevent uncovered actions or tools from generating fabricated tutorials; acknowledge a reported screen mismatch without inventing replacement UI instructions.
- [ ] Use the confirmed user-facing seam for lightweight explicit-request, coverage, and failure/retry checks with controlled media outcomes.
- [ ] Generate and inspect at least one real clip for intelligible narration, readable captions, matching highlights, the expected next state, and successful playback.

Screenshots are primarily video source assets. No full cross-tool video, automatic tab observation, progress tracking, general workflow planner, or production failure-management system is required.
