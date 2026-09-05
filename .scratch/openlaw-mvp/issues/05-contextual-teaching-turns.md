# 05 — Contextual teaching turns

**What to build:** Make contextual questions append ChatGPT-style teaching turns with direct answers, relevant screenshot guidance, coverage status, and a per-turn explicit Help Clip when reviewed coverage exists.

**Blocked by:** None — can start immediately.

**Status:** complete

- [x] Restore initial screenshot teaching while keeping Explore buttons removed.
- [x] Add a dedicated contextual-question endpoint instead of echoing Help Focus through selection guidance.
- [x] Append and preserve separate learner questions, tutor answers, screenshots, coverage, generation state, and clips.
- [x] Place initial text, screenshot, and video above the continuing conversation and bottom composer.
- [x] Keep the question composer visible without requiring a checked Help Clip tool; use ordered recommendations as context until tools are checked.
- [x] Use OpenRouter to answer each current question and remove fixed keyword answers.
- [x] Keep the latest three complete turns available to both screenshot selection and direct answering so follow-up references can resolve.
- [x] Bind contextual video tokens to the question, selected tools, selected screenshot evidence, scenario, and generated scene.
- [x] Keep the latest three complete turns as configurable contextual memory and enforce the bound on client and server.
- [x] Verify direct answers, screenshot restoration, per-turn video eligibility, history, coverage rejection, and reset behavior.

No new browser automation, progress tracking, fabricated interface imagery, or multi-tool Lesson Plan is included.
