# Issue tracker: Local Markdown

The user selected local Markdown for this project. The approved OpenLaw MVP tickets live under `.scratch/openlaw-mvp/issues/`, one numbered Markdown file per ticket. The local specification remains in `docs/spec.md`.

## Conventions

- Each ticket records its title, user-visible deliverable, explicit **Blocked by** references, **Status**, and unchecked acceptance criteria.
- Number tickets in dependency order and link local blockers by filename and title. Tickets without blockers state "None — can start immediately."
- Use **Status: ready-for-agent** for the approved tickets. This indicates a prepared ticket, not completed work or permission to ignore dependencies.
- Work only tickets whose blockers are complete. For this set, 01 and 02 can start independently; 03 requires both.
- Mark acceptance criteria complete only when the described work has been performed and verified. Creating a ticket does not complete it.
- Do not publish GitHub issues, apply remote labels, or modify a parent issue as part of this local ticket workflow.
- Read the project glossary and relevant ADRs before implementing a ticket. Keep the hackathon scope and user-facing testing seam from the specification.

## Approved ticket set

1. [Complete OpenLaw verified training assets](../../.scratch/openlaw-mvp/issues/01-complete-openlaw-verified-training-assets.md) — no blockers.
2. [Deliver scenario-driven recommendations and contextual help](../../.scratch/openlaw-mvp/issues/02-deliver-scenario-driven-recommendations-and-contextual-help.md) — no blockers; milestone one.
3. [Generate and play an OpenLaw Help Clip](../../.scratch/openlaw-mvp/issues/03-generate-and-play-an-openlaw-help-clip.md) — blocked by 01 and 02; milestone two.

The present authorization covers documentation revision and creation of these tickets only. Their application, capture, and media-generation work has not been executed.
