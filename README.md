# L.A.R.A

L.A.R.A stands for **Legal Adoption & Recommendation Assistant**. It is a local software-training tutor that recommends supported legal information tools, explains how they fit a non-confidential objective, grounds guidance in supplied screenshots, and creates short narrated Help Clips.

## Setup and run

### Prerequisites

- Node.js 22 (the current project has been tested with `v22.14.0`)
- pnpm 11 (tested with `11.19.0`)
- An OpenRouter API key for AI screenshot interpretation, contextual answers, narration, and video generation

### 1. Install dependencies

```powershell
pnpm install
```

### 2. Create the local environment file

```powershell
Copy-Item .env.example .env
```

Open `.env` and add the OpenRouter key:

```dotenv
OPENROUTER_API_KEY=your_key_here
OPENROUTER_MODEL=openai/gpt-5.5
OPENROUTER_TTS_MODEL=deepgram/flux-tts:free
OPENROUTER_TTS_VOICE=flux-bree-en
NEXT_PUBLIC_CONTEXTUAL_QUESTION_WINDOW=3
OPENROUTER_SITE_URL=http://localhost:3000
```

Only `OPENROUTER_API_KEY` is required. The remaining values already have the defaults shown above. `OPENAI_API_KEY` is accepted as a migration alias, but new setups should use `OPENROUTER_API_KEY`. Keep `.env` local; Git ignores it.

### 3. Start the development server

```powershell
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The development command validates and prepares all screenshot assets before starting Next.js.

If OpenRouter requests fail even with a valid key, confirm that the process running `pnpm dev` has outbound network access to `https://openrouter.ai`.

### 4. Production build

```powershell
pnpm build
pnpm start
```

## Supported tools

L.A.R.A has exactly three predefined recommendation targets:

| Tool | Supported purpose |
| --- | --- |
| TAFEP | Fair employment practices, workplace fairness, tripartite guidelines, resources, events, and related guidance |
| OpenLaw | Finding and reviewing public Singapore Supreme Court judgments |
| Judiciary.gov.sg / SG Courts | Court information, hearing listings, judgments, self-help guides, court services, e-platforms, and Sheriff's sales |

The model receives only these three catalog entries. Every returned tool ID is checked against the same allowlist and a local direct-match gate before it reaches the interface. L.A.R.A cannot display an invented or outside product as a recommendation. When none of the three tools directly fits the objective, the app returns:

> No suitable tools found at this moment.

It does not force an unrelated recommendation.

Additional tools may be added in future versions. Each new tool must be deliberately added to the catalog and allowlist, with its intended purpose and training coverage defined before L.A.R.A can recommend it. Until then, recommendations remain restricted to the three tools above.

## How to use L.A.R.A

### Ask for recommendations

Enter a non-confidential training objective in the message box or choose a sample prompt. Sending the message clears the composer and displays the original objective as the learner's chat message. L.A.R.A then shows up to three suitable tools with their intended use, advantages, limitations, and current tutorial coverage.

### Create a shared Help Clip

Select one or more recommended tools with the checkboxes. L.A.R.A retrieves relevant supplied screenshots, checks their reviewed descriptions and confirmed paths, and displays grounded Screenshot Guides. The **Generate shared Help Clip** button is enabled only when every selected tool has a valid grounded scene and Lesson Plan.

Video generation uses:

1. OpenRouter to select a restrained narration style.
2. OpenRouter text-to-speech to create MP3 narration.
3. Remotion to animate screenshots, highlights, and captions.
4. FFmpeg to produce a browser-ready H.264 MP4.

Completed videos are saved in `public/generated/` and returned with the label **Training demonstration**. Only one Help Clip render can run at a time.

### Continue the conversation

After recommendations appear, the same bottom composer becomes the contextual-question box. Follow-up answers use the checked tools as context. If no tools are checked, all recommended tools are used. The default memory window retains the latest three complete question-and-answer turns and can be changed with `NEXT_PUBLIC_CONTEXTUAL_QUESTION_WINDOW`.

A contextual answer can include its own grounded screenshots and Help Clip action when validated visual coverage exists.

### View generated videos

Select **Video gallery** beneath **New chat** in the sidebar. The gallery reads locally stored MP4 files from `public/generated/`, lists them newest first, and provides browser playback. Use **Refresh** after generating a clip if it has not appeared yet.

## Application flow

```text
Training objective
  → strict three-tool recommendation
  → tool selection
  → reviewed screenshot metadata and path validation
  → OpenRouter screenshot selection and interpretation
  → grounded Screenshot Guides
  → explicit Help Clip request
  → OpenRouter narration style and text-to-speech
  → Remotion rendering and FFmpeg processing
  → local MP4 and Video gallery
  → continued contextual question-and-answer turns
```

When no API key is available, initial recommendations still use the deterministic local catalog matcher. OpenRouter-dependent screenshot interpretation, contextual AI answers, narration, and Help Clip creation require a working key and network connection.

## Screenshot assets

The repository contains 86 source screenshots:

| Collection | Source folder | Images |
| --- | --- | ---: |
| LawNet and OpenLaw | [`Screenshots/LawNetScreenshots/`](Screenshots/LawNetScreenshots/) | 27 |
| TAFEP | [`Screenshots/TAFEPScreenshots/`](Screenshots/TAFEPScreenshots/) | 21 |
| Judiciary.gov.sg / SG Courts | [`Screenshots/JudiciaryGovScreenshots/`](Screenshots/JudiciaryGovScreenshots/) | 38 |

Human-reviewed descriptions, visible controls, and confirmed screenshot paths are stored in [`docs/references/`](docs/references/). `pnpm prepare-assets` verifies that every source PNG has one matching reference entry, checks confirmed paths, copies runtime originals, creates thumbnails, and rebuilds the manifest and searchable metadata under `public/assets/screenshots/`.

Do not edit generated runtime metadata directly. Update the source screenshot or its reference Markdown, then run:

```powershell
pnpm prepare-assets
```

Screenshot observations and reviewed instructions are labelled separately. A visual match does not prove that a live website action or legal transaction was completed. Within one tool, consecutive tutorial scenes must follow a confirmed path. Switching tools starts a separate route and is never described as a click between websites.

### OpenLaw coverage boundary

The manually reviewed OpenLaw workflow currently confirms the starting judgments screen and the instruction to locate the Search field. Populated search, submitted results, and opening a matching judgment still require separately captured and rehearsed evidence. Other supplied screenshots can support clearly labelled screenshot observations when they directly answer the objective.

## API routes

| Route | Purpose |
| --- | --- |
| `POST /api/recommend` | Returns zero to three allowlisted tool recommendations |
| `POST /api/guidance` | Builds grounded shared guidance for selected tools |
| `POST /api/contextual-question` | Answers a follow-up using selected or recommended tool context |
| `POST /api/help-clip` | Validates a signed grounded Lesson Plan and renders a Help Clip |
| `GET /api/videos` | Lists locally generated MP4 files for the Video gallery |

Recommendation objectives and contextual questions are limited to 1,200 characters. Guidance and Help Clips accept one to three unique allowlisted tools. Help Clip requests require a signed token issued with validated guidance, preventing the client from inventing scenes or Lesson Plans.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Prepare screenshot assets and start the Next.js development server |
| `pnpm build` | Prepare assets and create a production build |
| `pnpm start` | Run the completed production build |
| `pnpm test` | Run the Vitest test suite once |
| `pnpm test:watch` | Run Vitest in watch mode |
| `pnpm prepare-assets` | Validate screenshots and regenerate runtime image assets and metadata |
| `pnpm render:demo` | Generate a real narrated OpenLaw demonstration clip using OpenRouter |

## Verification

Run the automated checks:

```powershell
pnpm test
pnpm build
```

With `OPENROUTER_API_KEY` configured, run the real media check:

```powershell
pnpm render:demo
```

The demo writes an MP4 to `public/generated/`. Confirm that narration is audible, captions are readable, the highlight aligns with the intended interface element, and playback completes normally.

## Project structure

```text
app/                    Next.js pages and API routes
components/             Chat interface, tool selection, guides, and gallery
lib/                    Catalog, recommendation, screenshot, guidance, and video logic
remotion/               Help Clip composition
scripts/                Asset preparation and real-media demo
Screenshots/            Human-supplied source screenshots
docs/references/        Human-reviewed screenshot descriptions and paths
public/assets/          Prepared runtime screenshot assets
public/generated/       Locally generated media; ignored by Git
tests/                  Vitest route, logic, and interface tests
```

## Product boundary

L.A.R.A is a software-training prototype. It does not provide legal advice, decide legal relevance, inspect or control a learner's live browser, accept confidential matter documents, confirm that a website task was completed, or track long-term technology adoption. The learner remains responsible for legal judgment and for verifying information on the live source website.
