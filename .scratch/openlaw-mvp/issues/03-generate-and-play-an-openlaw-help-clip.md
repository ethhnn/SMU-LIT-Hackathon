# 03 — Generate and play an OpenLaw Help Clip

**What to build:** Milestone two: from the shared composer, an explicit OpenLaw-only Help Clip request resolves a reviewed Lesson Plan, produces OpenRouter supporting narration and TTS, animates its reviewed screenshots using Remotion/FFmpeg, and displays one playable narrated MP4.

**Blocked by:**

- [01 — Complete OpenLaw verified training assets](01-complete-openlaw-verified-training-assets.md)
- [02 — Deliver scenario-driven recommendations and contextual help](02-deliver-scenario-driven-recommendations-and-contextual-help.md)

**Status:** blocked

This ticket remains blocked until both prerequisites are complete; the status does not override these dependencies.

The application contains an intentionally narrow renderer path for the one reviewed OpenLaw-only Lesson Plan. A real OpenRouter-backed render produced a narrated H.264/AAC MP4 with the reviewed search-field screenshot, highlight, cursor, and captions. It does not complete this ticket or establish a Verified Workflow; the ticket remains blocked until Ticket 01's full capture/rehearsal is complete.

- [ ] Connect contextual Help Focus to the relevant reviewed OpenLaw instructions and assets from ticket 01's full Lesson Plan.
- [x] Start video generation only after an explicit request or retry for an exact selected set with a required reviewed Lesson Plan. Viewing a standalone screenshot is not a prerequisite.
- [ ] Preserve the reviewed core operational instruction while OpenRouter adapts supporting narration and captions to the Learner's difficulty.
- [ ] Generate real narration audio using OpenRouter TTS and compose the clip with Remotion/FFmpeg using screenshots, highlights, pointer movement, captions, and reviewed expected-state transitions.
- [x] Display a playable narrated MP4 labeled "Training demonstration." Text or still-image output alone does not satisfy this milestone.
- [x] Keep reviewed text and screenshot help available if generation fails, explain the failure simply, and offer an explicit retry.
- [x] Prevent uncovered actions, tools, or selected combinations from generating fabricated tutorials.
- [x] Use the confirmed user-facing seam for lightweight explicit-request, coverage, and failure/retry checks with controlled media outcomes.
- [ ] Generate and inspect at least one real clip for intelligible narration, readable captions, matching highlights, the expected next state, and successful playback.

Screenshots are primarily video source assets. No automatic tab observation, progress tracking, general workflow planner, or production failure-management system is required. A multi-tool video is permitted only after reviewed scenes and an explicit multi-tool Lesson Plan are added.
