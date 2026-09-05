# 02 — Deliver scenario-driven recommendations and contextual help

**What to build:** Milestone one: a Learner enters a non-confidential scenario, receives dynamic tool recommendations, selects one or more tools for a shared Help Clip, and gets grouped contextual text help. Deliver this complete user-facing path without waiting for the complete OpenLaw video assets.

**Blocked by:** None — can start immediately.

**Status:** complete

- [x] Accept free-text Training objectives with optional sample scenarios rather than requiring one preset OpenLaw lesson.
- [x] Use an OpenRouter-routed model to recommend relevant tools from a small curated catalog, showing intended uses, pros, cons, and tutorial availability.
- [x] Demonstrate appropriately different recommendations for document-comparison and judgment-search objectives; do not always replay a fixed list or pad suggestions with unrelated tools.
- [x] Allow selected-tool-set input and retain the scenario context, selected tool IDs, and Help Focus for follow-up questions.
- [x] Selecting a tool without tutorial assets still provides grouped high-level text and an honest coverage notice, without invented operational tutorials or redirection into an unrelated OpenLaw lesson.
- [x] Use high-level guidance where reviewed instructions are not yet available. Do not mark the incomplete OpenLaw screenshot set as verified coverage or enable a pretend video path.
- [x] Keep the training-only notice and omit real client document uploads, progress tracking, completion controls, and completion state.
- [x] Include lightweight checks through the confirmed user-facing testing seam for free-text entry, scenario-dependent recommendations, tool selection, contextual follow-up help, and uncovered-tool behavior. Use controlled external AI responses for repeatability and demonstrate actual OpenRouter recommendations in the working path.

Dynamic recommendations and high-level explanation are supported; arbitrary operational sequences, cross-tool execution, legal analysis, and production infrastructure are not. No separate scaffolding, progress-tracking, or future-work tickets are needed.

The application calls OpenRouter when `OPENROUTER_API_KEY` is present and falls back to the curated catalog otherwise. The real check returned OpenRouter-backed, different recommendations for document comparison and public judgment-search objectives; the controlled user-facing seam also passes.
