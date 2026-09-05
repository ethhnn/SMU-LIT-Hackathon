# SMU LIT Hackathon — Legal Technology Tutor

A hackathon prototype that helps lawyers discover relevant technologies and learn supported software operations through contextual text help and short, generated audio-video **Help Clips**.

The learner describes a non-confidential training objective, receives scenario-specific tool recommendations, and chooses a tool to explore. For supported actions, they can explicitly request a narrated demonstration built from reviewed screenshots and simulated interactions.

**Status:** MVP scope, specification, and three local delivery tickets are documented. Application implementation and the working video demonstration have not started. Complete OpenLaw tutorial coverage remains a delivery target.

The selected tools are **LawNet/OpenLaw, TAFEP, and Judiciary.gov.sg (SG Courts)**. The [specification](docs/spec.md) and [MVP plan](docs/mvp-plan.md) provide the implementation baseline, with OpenLaw as the first reviewed demonstration target. This README supersedes their earlier Litera Compare and iManage catalog examples; those documents have not yet been synchronized with the updated tool selection.

## The challenge

Law firms invest in technologies and processes that can struggle to become part of lawyers' daily work. Generic training can be difficult to apply to a particular task, while producing engaging, topic-specific educational videos takes time.

The supplied R&T challenge asks how to improve technology adoption and use generative audio-video to simulate user-system interactions in short educational clips based on practical use cases. See the [challenge brief](docs/challenge-brief.md) for the supplied wording and evidence limits.

This prototype demonstrates contextual software assistance and generated training media. It does not establish sustained adoption or make legal judgments for the learner.

## MVP experience

1. **Describe a training objective.** Enter free text or choose an optional example: find a judgment, locate fair employment guidance, or find a court hearing.
2. **Explore relevant tools.** OpenAI recommends technologies from a curated catalog with intended uses, advantages, limitations, and tutorial coverage. Recommendations change with the objective; there is no mandatory list or count.
3. **Choose a tool.** Receive contextual text help and ask follow-up questions within the same scenario chat.
4. **Request a Help Clip where supported.** Generate a short narrated demonstration focused on the current question or supported action. Viewing a standalone screenshot is not a prerequisite.
5. **Use the real tool separately.** For the OpenLaw exercise, the learner operates the website in another tab. The tutor does not inspect or control that tab.

The chat retains the training objective, conversation, recommendations, selected tool, and **Help Focus**: the step or question currently being discussed. Help Focus does not track completed work. Progress tracking and completion controls are outside the MVP.

Display the input notice:

> Training environment — do not enter confidential client or matter information.

Use generic or synthetic training scenarios. Real document uploads and confidential matter handling are outside scope.

## Recommendations and tutorial coverage

The curated catalog contains the following three tools. Recommendations select relevant tools from this catalog; a scenario does not need to recommend all three. Tutorial availability depends on reviewed coverage.

| Tool | MVP role | Tutorial coverage |
| --- | --- | --- |
| LawNet/OpenLaw | Locate judgments and navigate legal research resources; the first exercise uses public OpenLaw | Screenshots collected; first target for a fully reviewed demonstration workflow, with required evidence still incomplete |
| TAFEP | Locate fair employment practices, workplace guidance, resources, and contact information | Screenshots collected; action review and tutorial implementation pending |
| Judiciary.gov.sg (SG Courts) | Find court hearings, court services, judgments, and self-help resources | Screenshots collected; action review and tutorial implementation pending |

Catalog entries contain capabilities, intended uses, pros, cons, and coverage information. They do not imply live integrations, firm endorsement, or verified operational tutorials.

A learner selecting an action without reviewed coverage still receives relevant high-level help and a clear label such as **“Tutorial not yet available.”** A workplace-guidance or court-hearing objective must not be redirected into an unrelated OpenLaw lesson. Combined objectives may receive multiple relevant recommendations explaining each tool's role; cross-tool operational handoffs remain deferred.

Clip eligibility depends on the selected action's reviewed instructions and required assets, not merely the tool's presence in the catalog.

## First supported demonstration

The optional demonstration scenario is:

> A colleague has given you a judgment name. Use OpenLaw to locate and open the judgment.

The reviewed workflow will cover four operations:

1. Identify the search field.
2. Enter the supplied judgment name.
3. Run the search.
4. Open the matching judgment.

The target is the public [OpenLaw Supreme Court judgments interface](https://www.lawnet.com/openlaw/singapore/judgments/supreme-court). OpenLaw is one resource within the broader LawNet platform; this demonstration does not cover the complete paid LawNet research interface.

This workflow bounds tutorial implementation, not free-text scenario entry. Its purpose is software navigation, not evaluating a judgment's legal relevance. The exercise may use a real public judgment within a synthetic training scenario.

## Reviewed instructions and visual assets

A **Verified Action** is a manually tested operation with a known starting condition, a reviewed core instruction, an expected next state, and associated screenshots and highlight coordinates. A **Verified Workflow** is the complete sequence rehearsed end-to-end. A screenshot alone does not establish either.

Core operational instructions remain fixed. OpenAI supplies supporting explanations, narration, captions, and emphasis around them, and can select supported steps relevant to the learner's difficulty. It must not invent operations, reorder required dependencies, or assume untested handoffs.

Screenshots are primarily video scene assets. Highlights and pointer coordinates belong to the exact captured layout; expanded and collapsed sidebars require different positions. The clip shows the captured expected next state rather than generating a replacement interface.

The repository currently contains **86 screenshots**, named by visible page, section, or interface state:

| Tool | Screenshot folder | Images |
| --- | --- | --- |
| LawNet/OpenLaw | [LawNetScreenshots](Screenshots/LawNetScreenshots/) | 27 |
| TAFEP | [TAFEPScreenshots](Screenshots/TAFEPScreenshots/) | 21 |
| Judiciary.gov.sg (SG Courts) | [JudiciaryGovScreenshots](Screenshots/JudiciaryGovScreenshots/) | 38 |

The Judiciary captures include homepage menus, hearing-search filters, judgments, court services, e-platforms, Sheriff's sales and admiralty services, contact information, and court information pages. These collections include material outside the first OpenLaw workflow; collecting and naming images does not establish reviewed tutorial coverage. The [screenshot review](docs/screenshot-review.md) covers the earlier 11-image subset and still identifies those captures by their original timestamp names.

Required preparation remains:

- Choose one public judgment for the exercise.
- Capture a populated search, the corresponding submitted results, and the opened matching judgment using a consistent viewport and layout.
- Define highlights, review the four core instructions, and rehearse the full sequence.

## Help Clip generation

A Help Clip is a short demonstration focused on a supported action or portion of the reviewed workflow. It is generated only after an explicit **Generate Help Clip** request or **Retry Video** interaction. AI may suggest a clip without starting generation.

```text
Explicit Help Clip request
            ↓
Select supported action and reviewed visual assets
            ↓
OpenAI generates supporting narration and captions
            ↓
OpenAI TTS generates narration audio
            ↓
Use audio duration to inform scene timing
            ↓
Remotion composes screenshots, cursor motion,
highlights, zoom, captions, transitions, and audio
            ↓
FFmpeg participates in MP4 encoding/processing as needed
            ↓
Display playable Help Clip labeled “Training demonstration”
```

The label distinguishes the simulation from a recording of the learner's activity. A working narrated MP4 is a core deliverable; text and still-image help alone do not satisfy it.

If generation fails, retain reviewed text and annotated screenshot help and offer Retry Video. If the learner reports an interface mismatch, stop precise location guidance and explain the coverage limit; do not generate a clip from unverified instructions.

## Implementation boundary

Build one tutor application with scenario chat, a small curated catalog, one reviewed workflow, local training assets, and one media-generation path.

| Component | Decision |
| --- | --- |
| Scenario interpretation and recommendations | OpenAI, grounded in curated catalog metadata |
| Operational guidance | Fixed, manually reviewed instructions |
| Supporting explanations, narration, and captions | OpenAI |
| Narration audio | OpenAI TTS |
| Video composition | Remotion |
| MP4 encoding/processing | FFmpeg as needed; no separate processing service required |
| Frontend, database, hosting, SDK versions, models, and endpoint shapes | Not yet selected; resolve during implementation |

OpenAI is the selected generative AI provider. The earlier README's Next.js/React and SQLite suggestions are not binding decisions. No distributed services, durable job queues, general workflow planner, or complex narration-validation system is required.

## Delivery plan

The project uses the [local Markdown tracker](docs/agents/issue-tracker.md).

| Ticket | Deliverable | Dependencies |
| --- | --- | --- |
| [01 — Complete OpenLaw verified training assets](.scratch/openlaw-mvp/issues/01-complete-openlaw-verified-training-assets.md) | Missing captures, highlights, reviewed instructions, and workflow rehearsal | None |
| [02 — Deliver scenario-driven recommendations and contextual help](.scratch/openlaw-mvp/issues/02-deliver-scenario-driven-recommendations-and-contextual-help.md) | Free-text scenarios, relevant recommendations, selection, and contextual help | None; independent of asset preparation |
| [03 — Generate and play an OpenLaw Help Clip](.scratch/openlaw-mvp/issues/03-generate-and-play-an-openlaw-help-clip.md) | Explicitly requested, playable narrated Help Clip | Tickets 01 and 02 |

Tickets are prepared, not implemented. Their ready-for-agent status does not mean acceptance criteria or dependencies are complete.

## Demo acceptance

Use one user-facing end-to-end testing path with controlled AI/media outcomes for repeatable checks, plus one real generated narrated-video check.

- Free-text judgment-location, fair-employment-guidance, and court-hearing objectives produce relevant recommendations from LawNet/OpenLaw, TAFEP, and Judiciary.gov.sg. Sample scenarios remain optional.
- Uncovered tools provide contextual high-level help and coverage labels without fabricated tutorials or unrelated redirection.
- Contextual help follows the scenario and Help Focus without inferring completion.
- Only an explicit clip request or retry starts video generation, and only for actions with reviewed coverage.
- A real generated MP4 plays with audible narration, legible captions, aligned highlights, and the reviewed expected next state. Essential operational instructions are preserved.
- A video failure retains text/screenshot help and a retry option; a reported mismatch receives a coverage response.
- Manual rehearsal confirms that the four OpenLaw operations locate and open the chosen judgment.

## Outside this MVP

- Arbitrary AI-generated operational workflows, cross-tool execution, and handoffs.
- Full-workflow videos or complete tutorial libraries for other tools.
- Runtime browser observation/control, automatic UI-change detection, and completion detection.
- Progress tracking, completion controls, or claims that watching a clip proves successful execution.
- Legal advice, enforceability analysis, or legal relevance assessment.
- Real client uploads, confidential matter handling, enterprise authentication, and production privacy infrastructure.
- Distributed processing, complex validation, automatic recovery, and production reliability targets.
- Claims of sustained adoption based solely on the demonstration.

## Project documentation

- [MVP plan](docs/mvp-plan.md) — current flow, implementation boundary, and delivery checks.
- [Specification](docs/spec.md) — user stories, implementation decisions, and acceptance behavior.
- [Domain glossary](CONTEXT.md) — shared terminology.
- [Architecture decision records](docs/ADRs/) — accepted choices and their rationale.
- [Design review](docs/design-review.md) — settled outcome and remaining practical work.
- [Challenge brief](docs/challenge-brief.md) — supplied sponsor problem statement.
- [Evidence notes](docs/evidence-notes.md) and [screenshot review](docs/screenshot-review.md) — available evidence and its limits.
- [Local tracker convention](docs/agents/issue-tracker.md) — ticket status and dependency rules.

Team capacity, remaining build time, and API/cloud budget are deferred planning inputs. Implementation choices should stay proportionate to the hackathon demonstration.
