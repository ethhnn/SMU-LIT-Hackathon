# Hackathon prototype plan

Status: agreed MVP boundary and lightweight testing seam confirmed. Documentation is revised and three local tickets are created; their implementation has not started. This document supersedes earlier open-ended architecture exploration where it conflicts.

## Objective

Demonstrate scenario-driven tool recommendations followed by generated audio-video software training: the learner describes a non-confidential objective, OpenAI recommends relevant catalog technologies with pros/cons, and the learner selects a tool. Text provides immediate guidance; a working on-demand narrated Help Clip is a core deliverable. Screenshots are primarily the visual source material for that video. The tutor teaches software operations; the lawyer makes legal judgments.

## Scenario entry

Offer free-text task entry and optional samples: find a judgment, compare documents, or manage a case document. Recommendations adapt to the entered objective; samples are shortcuts, not the only accepted inputs. A comparison task may recommend a comparison tool even though its tutorial assets are not yet available. Selecting an uncovered tool still gives contextual high-level text and a coverage notice, without inventing operational instructions or redirecting to OpenLaw.

## Demonstration

Optional fully supported demonstration case: "A colleague has given you a judgment name. Use OpenLaw to locate and open the judgment." This limits tutorial implementation, not scenario input or recommendation coverage.

1. Start a scenario chat with that training objective.
2. Show relevant tool recommendations with intended uses, advantages, limitations, and tutorial-coverage labels.
3. Open the OpenLaw guidance. The learner uses the real OpenLaw page in another tab.
4. Explain where to search, entering the supplied name, running the search, and opening the matching judgment.
5. Answer a follow-up in text and offer Generate Help Clip for covered actions. A standalone screenshot can supplement help but is not a required step before video.
6. On Generate Help Clip, produce a short narrated simulation using reviewed screenshots, highlights, cursor movement, captions, and the expected next state.
7. Label the clip "Training demonstration." Retain only Help Focus for contextual questions; do not provide progress tracking or completion controls.

Target: https://www.lawnet.com/openlaw/singapore/judgments/supreme-court

## Tool recommendations and coverage

Keep the multi-tool recommendation experience. OpenLaw is the first tool targeted for complete tutorial coverage. Litera Compare and iManage may have high-level recommendation/demo descriptions, with "Tutorial assets not yet added." Do not imply live integrations, verified tutorials, or firm endorsement without evidence.

Recommendations should match the scenario: a judgment-location task primarily needs OpenLaw; a comparison task should prioritize a comparison tool. For combined objectives, recommend the relevant technologies and explain their roles. Aim for roughly three where useful, not a fixed count or fixed list. Dynamic tool recommendation is in scope; arbitrary generated operational workflows are not.

Enable video only for actions with the required reviewed assets. A tool-level label must not imply coverage of every operation in that product. OpenLaw coverage is a target: the supplied screenshots do not yet establish the complete search/open-judgment sequence.

## Small implementation outline

The screenshots are video scene assets: combine them with generated narration, TTS, cursor motion, highlights, zoom, captions, and reviewed next-state transitions to simulate the software interaction. Standalone screenshot display is supplementary help or fallback, not the main use of the assets.

Use a single tutor application with scenario-specific chat context, OpenAI scenario interpretation and recommendation, a small curated tool catalog, one reviewed tutorial workflow, and its local training assets. Catalog metadata contains capabilities, pros/cons, intended uses, and coverage; other tools need no tutorial libraries. No separate planning, monitoring, or browser-control systems are needed.

Each Verified Action needs only its starting state, reviewed core instruction, expected next state, and associated screenshot/highlight references. The entire four-step workflow is manually rehearsed. Core operational instructions remain fixed; generated supporting narration explains them without replacing them.

The agreed media path is:

```text
Explicit Help Clip request
  → Select the supported action and its reviewed assets
  → OpenAI generates supporting narration and captions
  → OpenAI TTS produces narration audio
  → Remotion composes screenshots, motion, highlights and captions with audio
  → FFmpeg participates in MP4 encoding/processing as needed
  → Display the labeled Help Clip
```

This ordering allows the actual narration audio to inform scene timing. It does not require a separate FFmpeg processing service. Exact SDK calls and rendering integration are implementation details to verify when implementation is authorized.

If generation fails, keep the reviewed text and annotated screenshot visible and provide Retry Video. No complex failure-management architecture or narration-validation system is required.

## Demo materials still needed

- Choose one judgment name for the exercise.
- Capture the populated search, submitted results, and opened matching judgment, using consistent layout/viewport settings.
- Review the core instructions and manually rehearse the transitions. Existing screenshots are candidate materials, not proof of a completed Verified Workflow.

See [screenshot review](screenshot-review.md) for all 11 inspected captures. [Ticket 01](../.scratch/openlaw-mvp/issues/01-complete-openlaw-verified-training-assets.md) owns the missing captures, highlight coordinates, instruction review, and rehearsal. It blocks the video ticket, not the independent contextual-help milestone.

## Local delivery tickets

1. Complete OpenLaw verified training assets — no blockers.
2. Deliver scenario-driven recommendations and contextual help — no blockers; milestone one.
3. Generate and play an OpenLaw Help Clip — blocked by 01 and 02; milestone two.

The [local tracker convention](agents/issue-tracker.md) links all three tickets. No application, screenshot capture, or video-generation work is performed by creating them.

## Demo checks

The single user-facing end-to-end testing seam is confirmed. Keep checks lightweight with controlled AI/media outcomes and one real generated narrated-video check.

- Free-text comparison and judgment-location objectives produce relevant, different recommendations.
- Samples are optional; a tool without tutorial coverage still receives contextual high-level text and an honest coverage label.
- A learner can follow the four software steps alongside OpenLaw.
- Follow-up help stays with the scenario and selected step; it does not infer completion.
- A requested Help Clip visibly combines generated narration with the reviewed visual interaction.
- A playable generated narrated video is required to complete the prototype; text or still-image help alone is insufficient.
- Tools without coverage cannot generate a pretend tutorial.
- A video failure leaves useful text/screenshot help and a retry option.

These establish the prototype behavior, not sustained adoption or production readiness.

## Out of scope

Arbitrary operational workflow generation; cross-tool execution/handoffs; progress tracking and completion controls; learner-tab observation/control; live inspection or computer-use agents; automatic completion or UI-change detection; real client uploads/confidential matter handling; enterprise authentication/privacy infrastructure; full-workflow videos; complete libraries for other tools; legal analysis or enforceability conclusions.

Display: "Training environment — do not enter confidential client or matter information."

## Remaining practical information

Team size, strengths, build hours, and API/cloud budget remain deferred. They inform scheduling, not additional architecture. No further broad design interview is needed. Ask only for information that directly blocks authorized implementation.
