# Hackathon prototype plan

Status: agreed MVP boundary and lightweight testing seam confirmed. Ticket 02 is complete; Ticket 01 and the remaining full-workflow criteria in Ticket 03 are incomplete. This document supersedes earlier open-ended architecture exploration where it conflicts.

## Objective

Demonstrate scenario-driven tool recommendations followed by generated audio-video software training: the learner describes a non-confidential objective, an OpenRouter-routed model recommends relevant catalog technologies with pros/cons, and the learner checks one or more tools for a shared Help Clip. Text provides immediate grouped guidance; a working on-demand narrated Help Clip is a core deliverable. Screenshots are primarily the visual source material for that video. The tutor teaches software operations; the lawyer makes legal judgments.

## Scenario entry

Offer free-text task entry and optional samples: find a judgment, compare documents, or manage a case document. Recommendations adapt to the entered objective; samples are shortcuts, not the only accepted inputs. A comparison task may recommend a comparison tool even though its tutorial assets are not yet available. Selecting an uncovered tool still gives contextual high-level text and a coverage notice, without inventing operational instructions or redirecting to OpenLaw.

## Demonstration

Optional fully supported demonstration case: "A colleague has given you a judgment name. Use OpenLaw to locate and open the judgment." This limits tutorial implementation, not scenario input or recommendation coverage.

1. Start a scenario chat with that training objective.
2. Show relevant tool recommendations with intended uses, advantages, limitations, and tutorial-coverage labels.
3. Check OpenLaw to include it in the shared Help Clip. The learner uses the real OpenLaw page in another tab.
4. Show grouped contextual guidance; the learner may ask a question about every checked tool.
5. For the OpenLaw-only selection, offer Generate shared Help Clip above the question field. A standalone screenshot can supplement help but is not a required step before video.
6. On Generate shared Help Clip, resolve the reviewed OpenLaw Lesson Plan and produce a short narrated simulation using its screenshots, highlights, cursor movement, captions, and expected next state.
7. Label the clip "Training demonstration." Below the initial media, keep the contextual question composer visible even when no tool is checked. Append teaching turns containing direct OpenRouter answers, relevant screenshot help, and optional explicitly generated videos. Retain only the latest three question-and-answer turns as model context; do not provide progress tracking or completion controls.

Target: https://www.lawnet.com/openlaw/singapore/judgments/supreme-court

## Tool recommendations and coverage

Keep the multi-tool recommendation experience. OpenLaw remains the first tool targeted for a fully rehearsed judgment workflow. The newly supplied TAFEP images provide screenshot-based guidance for workplace-fairness objectives, while Litera Compare and iManage remain metadata-only. Do not imply live integrations, verified interactions, or firm endorsement from screenshots alone.

Recommendations should match the scenario: a judgment-location task primarily needs OpenLaw; a comparison task should prioritize a comparison tool. For combined objectives, recommend the relevant technologies and explain their roles. Aim for roughly three where useful, not a fixed count or fixed list. Dynamic tool recommendation is in scope; arbitrary generated operational workflows are not.

The selection checkboxes do not open individual help panels. For one checked tool, section 3 uses the same indexed screenshot selector as follow-up questions and can generate a labelled screenshot-observation clip when an image is confirmed. A tool-level label must not imply coverage of every operation in that product. The manually reviewed OpenLaw plan still has one Search-field scene, and the supplied screenshots do not establish the complete search/open-judgment sequence. Multi-tool selections remain unavailable until every selected tool has a scene in one combined plan.

## Small implementation outline

The screenshots are video scene assets: combine them with OpenRouter TTS narration, cursor motion, highlights, zoom, captions, and reviewed next-state transitions to simulate the software interaction. OpenRouter chooses a bounded supporting emphasis; reviewed templates supply the spoken and captioned operational copy. Standalone screenshot display is supplementary help or fallback, not the main use of the assets.

Use a single tutor application with scenario-specific chat context, OpenRouter scenario interpretation and recommendation, a small curated tool catalog, one reviewed tutorial workflow, and its local training assets. Catalog metadata contains capabilities, pros/cons, intended uses, and coverage; other tools need no tutorial libraries. No separate planning, monitoring, or browser-control systems are needed.

Each Verified Action needs only its starting state, reviewed core instruction, expected next state, and associated screenshot/highlight references. A Lesson Plan names an exact selected tool set and fixes the ordered scenes to render; it is the only route to a shared video. The entire four-step workflow is manually rehearsed. Core operational instructions remain fixed; the bounded supporting emphasis changes the reviewed narration and caption without replacing an action.

The agreed media path is:

```text
Explicit shared Help Clip request
  → Resolve the exact selected set to its reviewed Lesson Plan
  → OpenRouter selects a permitted supporting emphasis
  → Reviewed narration/caption template + OpenRouter TTS produces audio
  → Remotion composes screenshots, motion, highlights and captions with audio
  → FFmpeg participates in MP4 encoding/processing as needed
  → Display one labeled shared Help Clip
```

This ordering allows the actual narration audio to inform scene timing. It does not require a separate FFmpeg processing service. Exact SDK calls and rendering integration are implementation details to verify when implementation is authorized.

If generation fails, keep the grouped guidance and reviewed assets visible and provide Retry Video. No complex failure-management architecture or narration-validation system is required.

Contextual questions do not run recommendations again. Checked tools narrow their context; when none are checked, the ordered recommendations provide context. Each question creates a separate teaching turn. Asset preparation writes a JSON keyword index for all 27 LawNet and 9 TAFEP screenshots. OpenRouter uses the scenario, the current question, and the latest three complete Q&A turns to shortlist from every indexed image for the applicable tools, then visually inspects those candidates before answering. A second vision call locates the relevant control for the highlight. The server owns full-resolution asset resolution and signs the chosen scene, so a client cannot substitute another image. Screenshot-derived media is labelled as observation and does not claim a rehearsed live interaction.

## Demo materials still needed

- Choose one judgment name for the exercise.
- Capture the populated search, submitted results, and opened matching judgment, using consistent layout/viewport settings.
- Review the core instructions and manually rehearse the transitions. Existing screenshots are candidate materials, not proof of a completed Verified Workflow.

See [screenshot review](screenshot-review.md) for the original manual review and the generated JSON index for all current captures. [Ticket 01](../.scratch/openlaw-mvp/issues/01-complete-openlaw-verified-training-assets.md) still owns the missing populated-search/results/opened-judgment captures and rehearsal needed for a verified end-to-end workflow.

## Local delivery tickets

1. Complete OpenLaw verified training assets — no blockers.
2. Deliver scenario-driven recommendations and contextual help — no blockers; milestone one.
3. Generate and play an OpenLaw Help Clip — blocked by 01 and 02; milestone two.
4. Shared Help Clip selection and Lesson Plans — completed implementation record; it does not satisfy Ticket 01's manual asset capture.
5. Contextual teaching turns — direct answers, restored screenshot teaching, per-turn optional clips, and three-turn memory.
6. Complete screenshot indexing and multimodal selection — generated keyword JSON, all LawNet/TAFEP assets, vision selection, and signed dynamic scenes.

The [local tracker convention](agents/issue-tracker.md) links all three tickets. No application, screenshot capture, or video-generation work is performed by creating them.

## Demo checks

The single user-facing end-to-end testing seam is confirmed. Keep checks lightweight with controlled AI/media outcomes and one real generated narrated-video check.

- Free-text comparison and judgment-location objectives produce relevant, different recommendations.
- Samples are optional; a tool without tutorial coverage still receives contextual high-level text and an honest coverage label.
- A combined scenario shows multiple selectable recommendations. A multi-tool selection without a Lesson Plan is clear about missing coverage and cannot generate a partial video.
- The contextual composer remains usable before any checkbox is selected and uses the current recommendations as its bounded tool context.
- A question is answered from its actual wording and recent conversation, searches the complete applicable image index, and visually verifies the selected screenshot rather than using a fixed question map.
- A learner can follow the four software steps alongside OpenLaw.
- Follow-up help stays with the scenario and selected step; it does not infer completion.
- A requested Help Clip visibly combines generated narration with the reviewed visual interaction.
- A playable generated narrated video is required to complete the prototype; text or still-image help alone is insufficient.
- Tools without coverage cannot generate a pretend tutorial.
- A video failure leaves useful text/screenshot help and a retry option.

These establish the prototype behavior, not sustained adoption or production readiness.

## Out of scope

Arbitrary operational workflow generation; unreviewed cross-tool execution/handoffs; progress tracking and completion controls; learner-tab observation/control; live inspection or computer-use agents; automatic completion or UI-change detection; real client uploads/confidential matter handling; enterprise authentication/privacy infrastructure; complete libraries for other tools; legal analysis or enforceability conclusions.

Display: "Training environment — do not enter confidential client or matter information."

## Remaining practical information

Team size, strengths, build hours, and API/cloud budget remain deferred. They inform scheduling, not additional architecture. No further broad design interview is needed. Ask only for information that directly blocks authorized implementation.
