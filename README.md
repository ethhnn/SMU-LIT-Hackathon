# R&T Workflow Tutor

This hackathon MVP helps a lawyer learn how to operate a relevant technology for a non-confidential training objective. It is a software-training tutor, not a legal-advice tool.

The learner writes a free-text objective or selects a sample. An OpenRouter-routed model recommends relevant technologies from a curated catalog, with intended uses, pros, limits, and tutorial coverage. The learner checks one or more recommended tools for a shared Help Clip and can continue with contextual teaching questions about that selected set.

The active asset library contains 27 LawNet screenshots and 21 TAFEP screenshots. OpenRouter searches their generated keyword index and visually checks candidate images for each objective or question. These images support labelled screenshot-observation clips; the separately reviewed OpenLaw workflow coverage remains limited to locating the Search field. Litera Compare and iManage receive high-level text only until screenshots are supplied.

The incoming project direction targets LawNet/OpenLaw, TAFEP, and Judiciary.gov.sg (SG Courts). The 38 Judiciary screenshots are now included in the repository, but Judiciary catalog integration and tutorials are pending. The running catalog still includes OpenLaw, TAFEP, Litera Compare, and iManage. Collecting screenshots does not establish reviewed tutorial coverage.

The supplied R&T challenge focuses on technology adoption and short educational audio-video demonstrations grounded in practical use cases. See the [challenge brief](docs/challenge-brief.md). The prototype does not establish sustained adoption or make legal judgments for the learner.

```text
Free-text training objective
  → OpenRouter scenario interpretation
  → Curated tool recommendations
  → Checkbox selection for a shared Help Clip
  → Complete tool-specific image keyword index
  → OpenRouter shortlist + visual screenshot selection
  → Shared contextual guidance and Help Focus
  → Explicit Generate shared Help Clip request for a grounded scene
  → OpenRouter supporting-style selection and TTS
  → Remotion animation + FFmpeg MP4 processing
  → Playable “Training demonstration” MP4
  → Continuing question → answer → screenshot/optional video turns
```

The tutor never controls, observes, or automates the learner’s OpenLaw browser tab. It does not accept documents or confidential matter information, infer task completion, build progress tracking, invent cross-tool workflows or handoffs, or assess legal relevance.

## Run locally

1. Copy `.env.example` to `.env` and set `OPENROUTER_API_KEY`. Keep `.env` local; it is ignored by Git.
2. Install dependencies with `pnpm install`.
3. Start the tutor with `pnpm dev`.
4. Open the local URL shown by Next.js.

The recommendation flow stays usable without a key through a catalog fallback, but screenshot interpretation and narrated Help Clips need the local OpenRouter key. Existing local `OPENAI_API_KEY` entries are accepted only as a migration alias for the supplied OpenRouter key; use `OPENROUTER_API_KEY` for new setup. `NEXT_PUBLIC_CONTEXTUAL_QUESTION_WINDOW=3` keeps the latest three complete question-and-answer turns as contextual memory for both image selection and answering.

## Verify the MVP

Run the lightweight user-facing checks:

```bash
pnpm test
pnpm build
```

After adding the API key, run one real-media check:

```bash
pnpm render:demo
```

It writes a narrated MP4 to `public/generated/`. Inspect it for audible narration, readable captions, aligned search-field highlight, and normal playback. This manual check is required before claiming the playable Help Clip milestone is complete.

## Current OpenLaw asset boundary

The selected public training target and exact asset status live in [docs/openlaw-training-assets.md](docs/openlaw-training-assets.md).

- **Ready:** the starting OpenLaw judgments screen and the reviewed instruction to locate the Search field.
- **Pending manual capture and rehearsal:** populated search, submitted results, and opened matching judgment.

The app labels screenshot observations separately from reviewed actions. A single supplied image may produce a screenshot-based clip after multimodal selection. Do not represent the four-step judgment-location workflow or any multi-tool clip as verified until the remaining materials are captured, reviewed, and rehearsed.

## Screenshot inventory

The repository contains 86 source screenshots named by page, section, or interface state:

| Collection | Source folder | Images | Runtime status |
| --- | --- | --- | --- |
| LawNet/OpenLaw | [LawNetScreenshots](Screenshots/LawNetScreenshots/) | 27 | Indexed for screenshot selection |
| TAFEP | [TAFEPScreenshots](Screenshots/TAFEPScreenshots/) | 21 | Indexed for screenshot selection |
| Judiciary.gov.sg (SG Courts) | [JudiciaryGovScreenshots](Screenshots/JudiciaryGovScreenshots/) | 38 | Collected; catalog integration and tutorial coverage pending |

Judiciary captures include homepage menus, hearing-search filters, judgments, court services, e-platforms, Sheriff's sales and admiralty services, contact information, and court information pages. Asset preparation indexes the 48 images belonging to the currently supported screenshot collections. Highlights must match each exact captured layout; signed-in pages and public OpenLaw pages are distinct interface states.

## Known issues and handover

The [screenshot-guidance handover](docs/handovers/2026-09-05-screenshot-guidance.md) records reproduced oversized highlights, wrong-page contextual answers, and the requested move to page-specific metadata and multi-screenshot explanations. Its evidence reflects the pre-merge 36-image library. These issues remain open; merging the expanded screenshot collections does not fix them.

## Project source of truth

- [MVP specification](docs/spec.md)
- [MVP plan](docs/mvp-plan.md)
- [Domain vocabulary](CONTEXT.md)
- [Architecture decisions](docs/ADRs)
- [Local ticket tracker](docs/agents/issue-tracker.md)

The local tickets preserve their dependency order: asset preparation and scenario guidance can proceed independently; the full Help Clip ticket remains blocked until the asset workflow is complete and the real rendered clip is inspected. The shared-composer ticket records the completed selection and coverage-gating work.
