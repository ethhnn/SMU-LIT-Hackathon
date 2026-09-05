# Design review

Status: MVP boundary settled by the user's latest instructions. No implementation authorized. Broad grilling has ended; further questions must directly unblock implementation.

The original concept is a proposal. The current [MVP plan](mvp-plan.md) consolidates the accepted scope and takes precedence over earlier unresolved design questions.

## Settled outcome

The learner enters a non-confidential training objective in free text or chooses an optional example. OpenAI recommends relevant curated catalog tools, shows pros/cons and tutorial coverage, and the learner selects a tool for contextual text help. Recommendations must respond to the objective, not always start the same lesson.

The first fully supported tutorial demonstration is: a colleague supplies a judgment name; the learner identifies the search field, enters the name, runs the search, and opens the matching judgment in public OpenLaw. This is a tutorial-coverage limit, not an input restriction. Other tools receive metadata-backed recommendations and high-level explanations without invented visual tutorials.

Keep scenario chat, scenario-specific context, multi-tool recommendations with pros/cons and coverage labels, text-first help, annotated screenshots, and explicit on-demand generated Help Clips. Only OpenLaw receives tutorial implementation initially. Other tools retain high-level recommendation/demo coverage.

The learner uses OpenLaw in a separate tab. The tutor does not observe or control it. Keep only Help Focus for the current step/question; progress tracking, completion state, controls, and labels are outside the MVP.

Reviewed core operational instructions remain fixed. OpenAI supplies supporting narration/captions and TTS; Remotion and FFmpeg produce the screenshot-based clip. No complex validation or failure architecture: retain text/screenshot help and offer retry if a clip fails.

Screenshots are primarily source assets for making the generated videos. Text is the quick-help entry point, while a working narrated Help Clip is the core audio-video demonstration. Standalone screenshot display is supplementary, not a prerequisite for video generation or a substitute for the video deliverable.

## Remaining practical work

The approved local ticket 01 owns choosing a public judgment, capturing the populated search/results/opened judgment, defining highlights, reviewing instructions, and rehearsing the four steps. Ticket 02 independently delivers scenario-driven recommendations, selection, and contextual help. Ticket 03 depends on both and delivers the playable narrated Help Clip. Team capacity and budget remain deferred; do not expand the design review.

The single user-facing end-to-end testing seam is confirmed. Keep checks lightweight using controlled AI/media outcomes, plus one real narrated-video check. Documentation and ticket creation are complete; the tickets themselves have not been implemented.

The [screenshot review](screenshot-review.md) distinguishes visible states from verified actions. OpenLaw's complete coverage remains a target until missing evidence is added.

## Documentation

- [MVP plan](mvp-plan.md): current flow, minimal architecture, materials, and demo checks.
- [CONTEXT.md](../CONTEXT.md): domain vocabulary.
- [ADRs](ADRs/): consequential accepted choices.
- [Challenge brief](challenge-brief.md): user-supplied sponsor problem statement.
- [Local tracker convention](agents/issue-tracker.md): ticket locations, statuses, and blocking rules.

Production concerns and future extensions are outside this review unless they directly block the OpenLaw demonstration. No further broad grilling round is needed.
