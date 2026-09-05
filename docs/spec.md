# Scenario-driven technology recommendations with OpenLaw Help Clips

Status: MVP specification and single user-facing end-to-end testing seam confirmed. The approved three-ticket breakdown is published to the local Markdown tracker. This revision authorizes documentation and ticket creation only, not application implementation.

## Problem Statement

Lawyers may know the legal task they need to accomplish but lack confidence operating the technologies available to them. Generic tutorials require them to find the relevant instruction and apply it to their situation. Producing short, use-case-specific educational videos manually also takes time.

For the R&T adoption challenge, demonstrate scenario-driven software training through generated audio-video Help Clips that simulate user-system interactions. The supplied screenshots are primarily source material for making those videos. Text provides quick contextual help; a working narrated video is a required core demonstration, not a stretch feature. Prove this within a hackathon without attempting enterprise deployment or substantive legal analysis.

## Solution

Provide a GPT-style Scenario chat where the Learner describes a non-confidential Training objective in free text or selects an optional prepared example. OpenAI interprets the scenario and recommends suitable technologies from a curated tool catalog. Prepared examples make the hackathon demonstration reliable; they are not the only supported input.

The Learner sees suitable technologies, their intended uses, advantages, limitations, and tutorial coverage, then chooses a tool to explore. Recommendations must change with the scenario: a comparison objective should prioritize a comparison tool, while a judgment-location objective should prioritize OpenLaw. A combined objective can suggest multiple relevant technologies without inventing operational handoffs between them.

After selection, give contextual text help. For a tool without tutorial assets, explain its role and limitations and show "Tutorial assets not yet added"; do not redirect every scenario into the OpenLaw lesson. Where reviewed coverage exists, offer Generate Help Clip. The clip uses the screenshots as visual scenes, adds simulated interaction, and combines generated narration, speech, and captions. A standalone annotated screenshot is optional supplementary help or fallback; viewing one is not a prerequisite for requesting video. OpenLaw is the first tool targeted for complete coverage of its selected demonstration workflow; other catalog entries require metadata rather than tutorial libraries.

The fully supported demonstration case is an optional example: "A colleague has given you a judgment name. Use OpenLaw to locate and open the judgment." For this case, the Learner opens the real OpenLaw page in another tab and follows four operations: identify the search field, enter the supplied judgment name, perform the search, and open the matching judgment. A requested Help Clip combines generated supporting narration and audio with reviewed visual states and is labeled "Training demonstration." This case limits tutorial implementation, not the scenarios accepted for recommendations.

The tutor does not observe the other tab, infer successful execution, assess legal relevance, or provide legal advice. If video generation fails, text and screenshot help remain available with a retry option.

## User Stories

1. As a Learner, I want to describe my own non-confidential Training objective in free text, so that recommendations address my task.
2. As a Learner, I want optional sample scenarios such as finding a judgment, comparing documents, or managing a case document, so that I can start quickly without being restricted to one lesson.
3. As a Learner, I want a training-only notice, so that I understand not to enter confidential client or matter information.
4. As a Learner, I want a conversational interface, so that I can describe a difficulty in familiar language.
5. As a Learner, I want follow-up questions to retain the current scenario context, so that I do not have to repeat my objective.
6. As a Learner, I want OpenAI to recommend suitable technologies from the catalog for my scenario, so that I can discover tools that address my objective.
7. As a Learner, I want recommendations to reflect the scenario, so that unrelated tools are not presented as necessary to complete my task.
8. As a Learner, I want intended uses, advantages, and limitations for each suggested tool, so that I can understand its role.
9. As a Learner, I want tutorial-coverage indicators, so that I can distinguish available guidance from future coverage.
10. As a Learner, I want to explore a tool without tutorial assets at a high level, so that I can learn its purpose without receiving invented instructions.
11. As a Learner, I want to choose a recommended tool and receive contextual text help, so that I can explore my preferred technology even when visual tutorials are unavailable.
12. As a Learner, I want to open the real OpenLaw page alongside the tutor, so that I can perform the software operations myself.
13. As a Learner, I want help locating the search field, so that I know where to begin.
14. As a Learner, I want an instruction for entering the supplied judgment name, so that I can prepare the search.
15. As a Learner, I want a reviewed instruction for running the search, so that I can obtain the corresponding results.
16. As a Learner, I want guidance opening the matching judgment, so that I can finish the training task.
17. As a Learner, I want text guidance first, so that I can obtain help without waiting for video generation.
18. As a Learner, I want the Help Clip to show the actual reviewed interface screenshots with animated guidance, so that I can see how the operation is performed.
19. As a Learner, I want to ask about any supported step, so that Help Focus follows my current question without requiring completion controls.
20. As a Learner, I want to request a Help Clip explicitly, so that video generation happens only when I choose it.
21. As a Learner, I want the Help Clip to focus on my difficulty, so that its explanation is useful to my current Help Focus.
22. As a Learner, I want narration and captions built around reviewed core instructions, so that personalization preserves the operational steps.
23. As a Learner, I want highlights, cursor motion, and a reviewed next state, so that the video demonstrates the interaction visually.
24. As a Learner, I want clips labeled as training demonstrations, so that I do not mistake them for recordings of my own work.
25. As a Learner, I want a clear coverage-limit response for unsupported actions or tools, so that I am not shown a fabricated tutorial.
26. As a Learner, I want the tutor to acknowledge a screen mismatch, so that it stops giving unsupported precise location instructions.
27. As a Learner, I want text and screenshot help to remain when a clip fails, so that I can continue learning.
28. As a Learner, I want a simple video retry option, so that I can request another attempt.
29. As a Learner, I want legal interpretation left to me, so that the tutor's software-training role is clear.
30. As a Learner, I want a document-comparison scenario to produce different recommendations from a judgment-search scenario, so that the assistant responds to my task rather than replaying a fixed demo.
31. As a Learner, I want relevant tools suggested for a combined task, so that I can understand their separate roles without being promised an unverified cross-tool workflow.
32. As a Learner, I want the OpenLaw sample to open the verified training path, so that I can try the complete generated audio-video experience when I choose it.

## Implementation Decisions

- **Application shape:** one tutor application, a small curated tool catalog, one reviewed OpenLaw workflow, and local training assets. No application code or existing module interfaces are present in the repository. Do not add distributed services or general workflow-planning machinery.
- **Scenario entry and recommendations:** accept free-text non-confidential scenarios from the start, with optional sample shortcuts. OpenAI interprets the objective and selects relevant technologies from the curated catalog. Aim for roughly three suggestions when relevant; do not pad a simple task with unrelated recommendations or always return the same list. Dynamic recommendations are a working MVP capability, not a static preview of future behavior.
- **Catalog:** maintain tool names, capabilities, intended uses, pros, cons, and tutorial-coverage status. OpenLaw also links to its reviewed actions and visual assets. Litera Compare and iManage need only curated metadata for recommendation and high-level text help; no integration or tutorial implementation is required. Do not claim unverified capabilities or endorsement.
- **Selection and text help:** the Learner may choose any recommended catalog tool. Adapt high-level explanations to the scenario even without visual coverage, clearly stating that tutorial assets are not yet added. Give precise operational instructions only where reviewed guidance supports them. A comparison-only request must not be forced into the OpenLaw training sequence.
- **Coverage:** eligibility for a Help Clip depends on the selected action's required reviewed assets, not merely the presence of a tool in the catalog. Show "Tutorial assets not yet added" for uncovered tools. Do not imply that the four-step workflow covers all OpenLaw features.
- **Scenario context:** retain the Learner's entered or selected Training objective, relevant conversation, recommendations, selected tool, and Help Focus for the active Scenario chat. Help Focus identifies the step or question currently being discussed; it does not record completed work. Enterprise matter isolation is not a claim of this prototype.
- **Workflow:** the first verified tutorial path is a manually reviewed, end-to-end rehearsed sequence for locating and opening a judgment by its supplied name. Free-text scenarios may receive recommendations without matching this path. AI may dynamically recommend tools and explain their roles, but operational tutorials remain manually verified: no invented operations, reordered dependencies, or untested cross-tool handoffs.
- **Action content:** each Verified Action contains a known starting condition, a manually written reviewed core instruction, its expected result, and relevant visual assets. Keep instructions as simple curated data; no general authoring or verification platform is required.
- **Visual evidence:** screenshots belong to specific interface states. Highlights and simulated pointer positions must match the associated image, including its layout. Do not reuse positions from an expanded sidebar on a collapsed-sidebar capture. Show the actual captured expected next state rather than fabricating a replacement interface.
- **Purpose of screenshots:** use them primarily as video scene assets. Remotion adds cursor movement, highlights, zoom, captions, and transitions between reviewed states; OpenAI supplies adapted narration and speech. Standalone screenshot assistance is supplementary. A chat response containing an image does not satisfy the audio-video deliverable.
- **Text and narration:** preserve essential operational instructions. OpenAI generates short supporting introductions, explanations, emphasis, narration, and captions around those instructions. A complex semantic-validation system is outside scope.
- **Help Clip generation:** only an explicit Generate Help Clip request or explicit retry starts generation. AI can suggest video without starting it. Select the supported action and assets, generate supporting narration, produce OpenAI TTS audio, and use Remotion with FFmpeg as needed to produce the MP4. Audio duration should inform scene timing. This is one media path, not a separate service architecture.
- **Personalization:** adapt explanation and instructional emphasis to the question and select relevant supported visual states. Do not claim personalization changes the underlying reviewed operation or records the Learner's activity.
- **External exercise:** the Learner operates the real OpenLaw page in a separate browser tab. The tutor does not inspect, control, or monitor that tab.
- **Help Focus:** follow the Learner's current question or supported step. Do not build progress tracking, completion controls, completion labels, or associated completion state.
- **Unsupported guidance:** explain the coverage limit. For a reported screen mismatch, stop precise location guidance, show the expected training screen if useful, and request a non-confidential description only if it may clarify the issue. Do not generate a new clip from unverified UI instructions.
- **Failures:** retain the reviewed text and annotated screenshot, display a simple inability-to-generate message, and provide Retry Video. No durable job queues, automatic recovery system, or production availability target is required.
- **Input boundary:** accept free-text generic or synthetic Training objectives and follow-ups; offer prepared examples as optional shortcuts. No real document uploads. Display "Training environment — do not enter confidential client or matter information." Free-text input does not authorize confidential matter handling, and the notice is not a claim of automated confidential-data detection.
- **Technology decisions:** OpenAI supporting generation and TTS, Remotion, and FFmpeg are selected. Frontend framework, database, hosting, SDK version, model choice, and exact endpoint shapes have not been selected; resolve those as simple implementation choices when coding is authorized rather than presenting the original concept's stack as binding.

## Testing Decisions

The single user-facing end-to-end testing seam is confirmed. Keep checks lightweight for the hackathon: controlled AI/media responses for repeatable user-visible behavior, plus one real generated narrated-video check.

- **One primary seam:** exercise the complete tutor application through the same user-facing interactions the Learner uses. Test the observable scenario-to-guidance-to-Help-Clip flow, not internal helper functions or the arrangement of modules.
- **Repeatable checks:** substitute controlled generation/media outcomes at the external dependency boundary so application behavior can be checked without repeatedly paying for narration and rendering. This is a testing convenience, not a new product subsystem or substitute for the real demo.
- **Scenario-driven recommendations:** enter a free-text comparison objective and a free-text judgment-location objective. Check that the recommendations and explanations reflect their different capabilities, rather than returning a fixed OpenLaw-first lesson. For a combined objective, check that suggested tools' roles are explained without inventing a cross-tool operational sequence. Test relevance and catalog membership, not exact AI wording or a mandatory count of three.
- **Optional samples:** the OpenLaw sample starts the reliable demonstration, while the free-text entry remains available without selecting a sample. Entering a comparison objective must not start the OpenLaw workflow.
- **Covered path:** select OpenLaw for a matching objective, request contextual help, and explicitly request a supported Help Clip. Check that the demonstration is shown in the right scenario and Help Focus.
- **Uncovered path:** select a relevant catalog tool without tutorial assets. Check that contextual high-level text and the coverage label remain available, video generation is unavailable, and the task is not redirected into an unrelated lesson.
- **Explicit request:** asking an ordinary question or receiving a screenshot must not start video generation. A Help Clip request and retry are explicit interactions.
- **Core audio-video acceptance:** the prototype is incomplete without a working on-demand narrated MP4 that simulates a supported interaction using the screenshots. The Learner can request it from contextual guidance without first viewing a standalone screenshot. Text and still-image output alone do not pass this check.
- **Coverage:** an uncovered tool or action receives an explanatory response and cannot start visual tutorial generation. An OpenLaw entry alone does not bypass missing action assets.
- **Mismatch and failure:** a reported interface mismatch produces a coverage response rather than new invented UI guidance. A failed clip leaves useful text/screenshot help and a working retry interaction.
- **Manual real-media check:** generate at least one real Help Clip using OpenAI generation/TTS and the chosen rendering path. Inspect playback, audible narration, legible captions, aligned highlights, and the reviewed next state. Confirm the essential operational instruction was preserved. Do not test exact generated wording or incidental pixel positions as acceptance criteria.
- **Manual workflow rehearsal:** carry out the four operations on the real OpenLaw page using the chosen judgment and confirm the matching judgment opens. This is manual preparation and demo verification, not runtime automation or automatic completion detection.
- **Prior art:** the repository currently contains a README, design documentation, and screenshots; there is no application test suite or existing testing seam to reuse. Do not introduce multiple layers of tests merely to create coverage.

## Out of Scope

- Legal advice, legal relevance assessment, enforceability analysis, or other autonomous legal conclusions.
- Arbitrary AI-generated operational workflows or cross-tool execution and handoffs. Dynamic scenario interpretation and tool recommendations are explicitly in scope.
- Tutorial implementation or complete screenshot libraries for tools other than the selected OpenLaw workflow.
- Full-workflow video generation, general video editing, or generative imitation of the OpenLaw interface.
- Browser/computer-use agents, runtime live inspection, control of the Learner's tab, or automatic UI-change detection.
- Progress tracking, completion controls and labels, automatic completion detection, or claims that a watched clip proves successful execution.
- Confidential matter/document handling, real client uploads, enterprise authentication, or production privacy infrastructure.
- Production-grade reliability, complex narration validation, distributed processing, automatic failure recovery, and broad tutorial coverage.
- Proving sustained adoption through analytics or longitudinal evaluation during this prototype.

## Further Notes

- Source of scope: the user's latest correction restores free-text scenario-driven recommendations and optional examples, while retaining the simplified tutorial implementation boundary. This supersedes earlier wording that made one prepared scenario mandatory. Earlier speculative production concerns are not additional requirements.
- Public training target: https://www.lawnet.com/openlaw/singapore/judgments/supreme-court. Use "OpenLaw" for this public interface, not a claim of complete paid LawNet research coverage.
- The eleven supplied screenshots have been inspected. They show search controls, the sort menu, and search-help states, but not a submitted query, its corresponding results, or an opened judgment. Complete OpenLaw tutorial coverage remains a delivery target, not an already verified fact.
- Local ticket 01 owns preparation: choose one public judgment, capture the populated search/results/opened judgment, define highlights, review the four core instructions, and rehearse expected results. It is an explicit blocker for ticket 03's Help Clip path, not for ticket 02's high-level contextual-help milestone. Do not fabricate missing states or mark incomplete materials as verified.
- The Training scenario is synthetic; the public judgment used in the exercise need not be fictional. The tutor's goal is locating and opening it, not evaluating its legal significance.
- Team size, strengths, remaining hours, and API/cloud budget are still deferred. They inform scheduling and practical implementation choices; they do not justify expanding this specification.
- Publication uses the confirmed local Markdown tracker. Tickets 01 (assets) and 02 (scenario-driven recommendations and contextual help) have no blockers; ticket 03 (playable OpenLaw Help Clip) is blocked by both. All carry ready-for-agent status, which does not override blocking references. No GitHub issue or parent issue is changed by this work.
