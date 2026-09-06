# L.A.R.A

L.A.R.A (Legal Adoption & Recommendation Assistant) helps a lawyer learn how to operate a relevant technology for a non-confidential training objective. It is a software-training tutor, not a legal-advice tool.

The learner writes a free-text objective or selects a sample. An OpenRouter-routed model recommends relevant technologies from a curated catalog, with intended uses, pros, limits, and tutorial coverage. The learner checks one or more recommended tools for a shared Help Clip and can continue with contextual teaching questions about that selected set.

The active asset library contains 27 LawNet screenshots, 21 TAFEP screenshots, and 38 Judiciary.gov.sg screenshots. Asset preparation validates these images against the human-reviewed files in [`docs/references/`](docs/references/), then generates searchable metadata containing the correct website/product identity, visible controls, filters, captured state, and confirmed screenshot-to-screenshot paths. OpenRouter uses that metadata both to shortlist images and to interpret the selected screenshot. Screenshot Guides and generated videos reject disconnected scene sequences and use the reviewed path action between valid scenes. These images support labelled screenshot-observation clips; the separately reviewed OpenLaw workflow coverage remains limited to locating the Search field. Litera Compare and iManage receive high-level text only until screenshots are supplied.

The running catalogue includes OpenLaw, TAFEP, Judiciary.gov.sg / SG Courts, Litera Compare, and iManage. Judiciary has screenshot-observation coverage but no manually rehearsed workflow. Collecting and describing screenshots does not by itself establish reviewed tutorial coverage.

The supplied R&T challenge focuses on technology adoption and short educational audio-video demonstrations grounded in practical use cases. The prototype does not establish sustained adoption or make legal judgments for the learner.

```text
Free-text training objective
  → OpenRouter scenario interpretation
  → Curated tool recommendations
  → Checkbox selection for a shared Help Clip
  → Validated human-reviewed screenshot reference index
  → OpenRouter shortlist + ordered visual screenshot selection
  → Shared contextual guidance and Help Focus
  → Explicit Generate shared Help Clip request for grounded scenes
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

- **Ready:** the starting OpenLaw judgments screen and the reviewed instruction to locate the Search field.
- **Pending manual capture and rehearsal:** populated search, submitted results, and opened matching judgment.

The app labels screenshot observations separately from reviewed actions. One to three supplied images may produce a screenshot-based clip after multimodal selection. Broad objectives can use an access scene followed by destination-page scenes; narrow questions should keep the sequence minimal. Do not represent the four-step judgment-location workflow or an unreviewed cross-tool handoff as verified until the remaining materials are captured, reviewed, and rehearsed.

## Screenshot inventory

The repository contains 86 source screenshots named by page, section, or interface state:

| Collection | Source folder | Images | Runtime status |
| --- | --- | --- | --- |
| LawNet/OpenLaw | [LawNetScreenshots](Screenshots/LawNetScreenshots/) | 27 | Indexed for screenshot selection |
| TAFEP | [TAFEPScreenshots](Screenshots/TAFEPScreenshots/) | 21 | Indexed for screenshot selection |
| Judiciary.gov.sg (SG Courts) | [JudiciaryGovScreenshots](Screenshots/JudiciaryGovScreenshots/) | 38 | Indexed for screenshot selection |

Judiciary captures include homepage menus, hearing-search filters, judgments, court services, e-platforms, Sheriff's sales and admiralty services, contact information, and court information pages. Asset preparation indexes all 86 images and fails if a source screenshot and its Markdown reference do not match. Highlights must match each exact captured layout; signed-in pages and public OpenLaw pages are distinct interface states.

## Screenshot references

The human-reviewed screenshot index is in [docs/references/](docs/references/). Keep those files aligned with the source images because asset preparation validates them before development and production builds.
