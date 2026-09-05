# Issue tracker: Local Markdown

The user selected local Markdown for this project. The approved OpenLaw MVP tickets live under `.scratch/openlaw-mvp/issues/`, one numbered Markdown file per ticket. The local specification remains in `docs/spec.md`.

## Conventions

- Each ticket records its title, user-visible deliverable, explicit **Blocked by** references, **Status**, and unchecked acceptance criteria.
- Number tickets in dependency order and link local blockers by filename and title. Tickets without blockers state "None — can start immediately."
- Publish prepared tickets with **Status: ready-for-agent**. When work begins, update the status to **in-progress**; use **blocked** only when the stated dependency prevents further work. Use **complete** only after every acceptance criterion has been performed and verified. A status never overrides dependency references.
- Work only tickets whose blockers are complete. For this set, 01 and 02 can start independently; 03 requires both. Ticket 04 has no dependency because it records the independently completed shared-composer implementation.
- Mark acceptance criteria complete only when the described work has been performed and verified. Creating a ticket does not complete it.
- Do not publish GitHub issues, apply remote labels, or modify a parent issue as part of this local ticket workflow.
- Read the project glossary and relevant ADRs before implementing a ticket. Keep the hackathon scope and user-facing testing seam from the specification.

## Approved ticket set

1. [Complete OpenLaw verified training assets](../../.scratch/openlaw-mvp/issues/01-complete-openlaw-verified-training-assets.md) — no blockers.
2. [Deliver scenario-driven recommendations and contextual help](../../.scratch/openlaw-mvp/issues/02-deliver-scenario-driven-recommendations-and-contextual-help.md) — no blockers; milestone one.
3. [Generate and play an OpenLaw Help Clip](../../.scratch/openlaw-mvp/issues/03-generate-and-play-an-openlaw-help-clip.md) — blocked by 01 and 02; milestone two.
4. [Shared Help Clip selection and Lesson Plans](../../.scratch/openlaw-mvp/issues/04-shared-help-clip-selection-and-lesson-plans.md) — complete; checkbox selection, shared coverage gating, and one-plan rendering.
5. [Contextual teaching turns](../../.scratch/openlaw-mvp/issues/05-contextual-teaching-turns.md) — complete; direct answers, screenshot teaching, per-turn media, and bounded memory.
6. [Index and search all supplied screenshots](../../.scratch/openlaw-mvp/issues/06-index-and-search-all-supplied-screenshots.md) — complete; generated keyword index, multimodal selection, dynamic scenes, and section 3 cleanup.

The user has authorized implementation. Keep the tickets as the local delivery record: mark an acceptance criterion only after it has been performed and verified, and do not treat application code as proof that the remaining manual capture or real-media checks are complete.
