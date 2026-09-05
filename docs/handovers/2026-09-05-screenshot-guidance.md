# Handover: inaccurate highlights, wrong page selection, and single-screenshot answers

**Project:** R&T Workflow Tutor / SMU legal-tech hackathon  
**Date:** 5 September 2026  
**Status:** Open; reproduced in the running application. Fixes have not been implemented in this handover.  
**Local application:** http://localhost:3001/

The tutor can return a plausible instruction with the wrong page or a highlight covering most of the screen. It also forces every visual answer into one screenshot, even when explaining the task needs several pages. Fix retrieval, evidence grounding, and the response structure together; changing the circle styling alone will not resolve this.

## What the user needs

- Keep dynamic recommendations for free-text training objectives and checkbox tool selection.
- Associate image keywords with specific pages, interface states, and controls. A request about Research must be able to move away from a previous Legislation page.
- Use recent conversation to understand references, while giving an explicitly named new topic priority over the earlier topic.
- Allow multiple relevant screenshots in one answer when they help explain the objective or question. Each screenshot needs its own purpose, explanation, and accurate highlight.
- Preserve initial screenshot teaching, chronological follow-up answers, and per-answer media. Keep the question composer below the teaching and video.
- Generate a narrated Help Clip only when the learner clicks Generate. Where a supported explanation uses several scenes, compose those scenes into one clip.
- Keep the three-question memory window configurable in `.env`. Do not solve this by sending the whole conversation indefinitely.
- Do not hardcode the reported questions or special-case words such as “research” to a fixed answer. Generalize through page metadata and contextual retrieval.

This handover records the latest request; older specification text limiting an answer to one screenshot needs updating during implementation. Continue the hackathon scope: no browser-control feature, automatic progress tracking, invented interfaces, or unverified cross-tool handoffs.

## Evidence and reproduction

The attached `sample.pdf` is a five-page printout of the tutor's responses, not an input document that the application is expected to ingest. All five pages were visually inspected. Copies of the report and screenshot are included so the handover can travel with the repository:

- [User's sample PDF](evidence/2026-09-05/sample.pdf)
- [User's reported highlight](evidence/2026-09-05/reported-highlight.png)
- [Live reproduction of the initial highlight](evidence/2026-09-05/live-initial-highlight.png)
- [Live API response summary, generation tokens omitted](evidence/2026-09-05/live-response-summary.json)

The live check used a fresh browser session against the local tutor. It did not interact with the external LawNet site or generate a video. Model responses can vary; the recorded responses are one reproduction, not a claim that every run is identical.

### Reproduction steps

1. Open the local tutor and submit this objective:

   > I would like to research more about fair workplace practices, the relevant legislation behind them, and where the addition of these laws are published

2. Observe recommendations. Both the PDF and live check showed **TAFEP**, then **OpenLaw**.
3. Check **OpenLaw** only, matching the PDF. Inspect the initial screenshot teaching.
4. Ask:

   > how can I obtain the research list from lawnet

5. Then ask:

   > how to look for asian insights

6. Inspect the answer, selected screenshot, highlighted control, and whether the explanation actually addresses the current question.

### Observed failures

| Issue | Evidence | Expected behavior |
| --- | --- | --- |
| Highlight is far too broad | PDF pages 3-5 and attached PNG. Live initial response uses `lawnet-browse-legislation.png`, dimensions `2866 × 1538`, with `{x:143,y:231,width:2579,height:461}`. The box spans about 90% of the image width. | Highlight the specific control named by the instruction. If teaching navigation to Legislation, target the visible **Legislation** navigation item, rather than framing the heading and unrelated rows. |
| Research question is redirected to legislation | PDF page 3: “Click on the 'Legislation' section…” Live: “Navigate to the 'Browse Legislation' section on LawNet to view the list of available legislation.” | Consider the Research page and its search controls. “Research list” is ambiguous: clarify whether the learner means search results or another list when the evidence cannot resolve that distinction. Do not silently equate research with legislation. |
| The objective is only partially addressed | Initial teaching shows Browse Legislation and claims it contains laws about workplace practices. The visible rows are Companies Act 1967, Supreme Court of Judicature Act 1969, and Rules of Court 2021. | Separate the objective's information needs: workplace guidance, legislation, and publication information. Explain which parts the catalog/evidence covers and which remain unsupported. A generic legislation list does not establish relevance to workplace practices. |
| Generated text misreads a visible title | PDF pages 3-4 say **Companies Act 1947**; the source screenshot and attached PNG show **Companies Act 1967**. The live follow-up happened to read 1967 correctly. | Copy visible titles and years accurately or omit an uncertain detail. Do not present inferred legal relevance as an image observation. |
| Asian Insights target is poorly located | PDF pages 4-5 and live response choose an Asian Insights image but highlight a broad region. Live box: `{x:287,y:310,width:2299,height:466}` on `2874 × 1552`. | Show the relevant navigation/menu state and, where useful, the destination screenshot. Identify **Asian Insights** / **Latest News** precisely. |
| Tool label does not match the interface | Cards describe OpenLaw as a public judgment resource, but teaching uses broader signed-in LawNet Research, Legislation, and Asian Insights screens labelled “OpenLaw.” | Model the platform and page identity accurately; do not imply that all signed-in LawNet capabilities belong to public OpenLaw. |

The PDF prints some highlight interiors as opaque white; the supplied PNG and live browser show a translucent yellow fill. The oversized geometry is independently reproduced in the browser. Treat print styling as a secondary issue, rather than assuming white PDF interiors explain the retrieval failure.

TAFEP's catalog role addresses the workplace-guidance part. The evidence does **not** establish one complete replacement recommendation list. The current four-tool catalog has no dedicated legislation/publication entry, and the generic OpenLaw reason does not explain the missing parts. Improve capability coverage and state gaps; do not add unrelated tools merely to return three cards.

## Current implementation and likely causes

These are code observations and investigation leads. No patch has yet proved a single root cause.

1. **The JSON index exists, but metadata is shallow.** `scripts/prepare-assets.mjs` indexes 27 LawNet and 9 TAFEP PNGs, creates 640px-wide JPEG thumbnails, and writes `manifest.json` plus `image-keywords.json`. Keywords come from filenames. There are no explicit page IDs, navigation paths, access states, control labels, or supported-task descriptions. `lib/screenshot-library.ts` actually reads the manifest and constructs the model's keyword prompt from it; editing only `image-keywords.json` will not affect retrieval. Both generated files are overwritten by preparation/build.

2. **All LawNet-folder images receive `toolId: "openlaw"`.** This includes wider LawNet interfaces and other resources. `CONTEXT.md` already distinguishes LawNet from OpenLaw, but the asset mapping does not. Audit ownership at the image level, not only the folder level.

3. **Retrieval can search other pages, but may choose the wrong ones.** `shortlistScreenshots()` searches all applicable tool assets each question and takes up to six candidates. There is no literal same-page-only filter. However, filename-only metadata and shared scenario/history text can bias selection toward Legislation. The lexical fallback weights matching words from scenario, previous answers, and current question together. Record the shortlist during diagnosis to distinguish a retrieval miss from the vision model choosing badly among good candidates.

4. **One screenshot is enforced in the response model.** `visualDecisionSchema` returns a singular `screenshotId`; the vision prompt says “If exactly one supplied image materially helps.” `answerWithScreenshotLibrary()` returns one `guide` and one `scene`. Initial and contextual endpoints wrap this as `[result.guide]`. Although the UI already maps an array of teaching items, the server cannot return a multi-page explanation through this path.

5. **Highlights are numerically accepted without checking the named target.** `normalizedHighlightSchema` accepts coordinates up to 1000. `toHighlight()` guesses whether the values use a 0-1 or 0-1000 scale, clamps them, and converts them to original-image pixels. `refineHighlight()` asks for a tight box but accepts any schema-valid result, falling back to the first model box on failure. There is no target-overlap or oversized-region quality check. The vision selection uses low-detail thumbnails; the refinement also receives the thumbnail, even with `detail: "high"`.

6. **Bad geometry propagates into both teaching and video.** `ScreenshotTeaching` converts the supplied box into CSS percentages. Dynamic Lesson Plans place the video cursor at its center. A signed token protects scene data against client changes; it does not establish that the model's instruction or coordinates are correct.

7. **Initial explanatory text is discarded.** `getSharedGuidance()` receives `result.answer` but returns a fixed “closest supplied screenshot” paragraph. That suppresses a potentially useful explanation of the objective and its coverage gaps.

### What memory currently carries

The live second-question request contained the original scenario, `toolIds: ["openlaw"]`, the new Asian Insights question, and the previous research question/answer. Memory is being passed. Asian Insights also selected a different image, so the app is not universally stuck on the same page.

`components/Tutor.tsx` sends the latest six text messages by default, and `/api/contextual-question` applies the same server limit through `lib/context-window.ts`. `.env.example` sets `NEXT_PUBLIC_CONTEXTUAL_QUESTION_WINDOW=3`.

The original scenario stays present, but the initial screenshot lesson is **not** in `questionHistory()`. Prior screenshot IDs, page identities, region IDs, and evidence labels are also absent. A question referring to “this page” or “the first screenshot” therefore lacks explicit visual context. The first follow-up Q&A also expires once it falls outside the three-turn window, even though it remains visible in the UI. Preserve bounded memory and communicate these limits rather than promising permanent recall.

## Suggested implementation order

### 1. Make evidence describe pages and controls

Keep a small editable JSON source alongside the screenshot library. Generate runtime indexes from it and filenames, preserving authored metadata across builds. Suggested fields:

- `assetId`, platform/product identity, `pageId`, page title, navigation path, and signed-in/signed-out/interface state.
- Page-specific keywords, short description, visible control labels, supported tasks, and limits of what the screenshot establishes.
- Original image dimensions and optional reviewed regions with stable IDs, labels, and coordinates tied to that exact image.
- Related screenshot/page IDs. Record a navigation transition only if supported by evidence; a related page is not automatically a rehearsed next step.

For example, annotate `lawnet-research-classic-search.png` as the Research / Classic Search page, with the visible **Research** item, **Search LawNet** heading, **Search by titles, keywords or citations...** field, and **Filters** control. These describe reusable evidence rather than matching one question string. Existing `lawnet-research-ai-search.png`, `lawnet-browse-legislation.png`, and the Asian Insights menu/destination images are distinct candidates.

Let the current question drive page selection. Use the scenario and recent turns to resolve references; allow an explicit topic change to move to another page. Ambiguous requests should receive a useful clarification instead of confident instructions for an unrelated page. Start with this metadata improvement; a new database or retrieval service is unnecessary for 36 images.

### 2. Return an explanation with the necessary screenshot sequence

Change the screenshot-assistant result to return an ordered, bounded list of screenshot guides/scenes, with an explanation of why each is included. Use the minimum necessary: zero for an unsupported question, one for a single control, several when navigation and destination evidence help.

The UI's existing `teachingItems` array can be reused. Update the model schema, initial guidance, contextual answer, dynamic scene/token contracts, and server validation together. Retain the direct answer instead of replacing it with the generic closest-image message.

Carry compact prior page/asset IDs and relevant evidence labels with the latest three turns and the initial lesson context. Treat client-supplied IDs as untrusted and resolve them against the server index. Do not send every image or unlimited history. Earlier assistant assertions are conversational context, not verified evidence.

For Asian Insights, a navigation screenshot plus an appropriate destination screenshot may explain more than one oversized highlight. Check signed-in versus signed-out states before claiming they form an executable sequence. The research-search screenshot does not itself prove a results page or export workflow; label missing states honestly.

### 3. Validate highlights and visible facts

Use one explicit coordinate convention with exact image dimensions. Prefer reviewed regions for supplied demo assets; the model can select a region ID using its meaning. Where dynamic localization remains useful, inspect an adequately legible image and reject unsupported or excessive boxes instead of treating clamping as validation.

Check that the highlight corresponds to the instruction's actual control, and that labels, titles, and dates agree with the screenshot. If uncertain, keep useful text/screenshot teaching without a misleading marker or fabricated video action. Apply the same validated geometry to the web overlay and video cursor.

### 4. Carry every supported scene into the requested video

`remotion/HelpClip.tsx` and `lib/video.ts` already accept scene arrays, but `getLessonPlanForDynamicScene()` constructs a single-scene plan. Extend the signed representation and resolution for the ordered scene list, validate every asset, and render one narrated MP4 after an explicit click. Check narration-to-scene alignment: the current renderer divides total duration equally, which may not match unequal narration lengths.

Keep screenshot observations distinct from manually reviewed interactions. Current ADR 0011 permits requested observation clips, while parts of the older spec/glossary still describe reviewed-only plans. Reconcile those documents with the chosen implementation; never imply a screenshot proves an action was rehearsed. Multi-tool videos must cover every selected tool and must not invent a handoff.

## Files to start with

Paths below are relative to the repository root `SMU-LIT-Hackathon`.

| Area | Files |
| --- | --- |
| Index authoring/preparation | `scripts/prepare-assets.mjs`, `lib/screenshot-library.ts`, `public/assets/screenshots/manifest.json`, `public/assets/screenshots/image-keywords.json` |
| Tool/page identity and recommendation gaps | `lib/catalog.ts`, `lib/recommendations.ts`, `CONTEXT.md` |
| Retrieval, answers, highlight localization | `lib/screenshot-assistant.ts`, `lib/guidance.ts`, `lib/contextual-questions.ts` |
| Teaching UI and bounded history | `components/Tutor.tsx`, `app/globals.css`, `lib/context-window.ts`, `lib/contracts.ts`, `app/api/contextual-question/route.ts` |
| Scene validation and media | `lib/dynamic-scene.ts`, `lib/help-clip-token.ts`, `lib/lesson-plans.ts`, `app/api/help-clip/route.ts`, `lib/video.ts`, `remotion/HelpClip.tsx` |
| Tests | `tests/screenshot-library.test.ts`, `tests/contextual-question-route.test.ts`, `tests/Tutor.test.tsx`, `tests/context-window.test.ts`, `tests/help-clip-route.test.ts`, `tests/recommendations.test.ts` |
| Design and delivery records | `docs/spec.md`, `docs/ADRs/0011-use-curated-support-topics-for-contextual-turns.md`, `docs/agents/issue-tracker.md`, `.scratch/openlaw-mvp/issues/06-index-and-search-all-supplied-screenshots.md` |

Ticket 06 is currently marked complete. Its existing checks establish index coverage and the technical flow, but do not settle the semantic and visual failures reported here. Record follow-up work in the Local Markdown tracker; no GitHub publication is needed.

## Acceptance checks for the fix

- [ ] The reported research question no longer silently maps to Browse Legislation. It selects relevant research evidence or asks a targeted clarification.
- [ ] Paraphrased and unrelated questions work through the same retrieval path; no exact-question branches are introduced.
- [ ] Explicit topic changes choose the relevant new page. Pronoun follow-ups use available recent page/answer context.
- [ ] A task needing several supplied screenshots produces an ordered explanation with each image's own instruction, evidence label, and precise target. Simple tasks still use one image when sufficient.
- [ ] Recommendations explain the covered parts of the original objective and its gaps. LawNet platform screens are not misrepresented as public OpenLaw capabilities.
- [ ] Legislation and Asian Insights highlights surround the actual named controls at desktop and narrower widths. Unknown targets do not get an arbitrary large box.
- [ ] Visible titles and dates agree with their source images, including the reported 1967/1947 discrepancy.
- [ ] Memory remains bounded to three recent Q&A turns by default, with compact visual context; a new scenario clears the conversation and media.
- [ ] Text/screenshots remain available above the bottom composer. Only an explicit Generate/Retry click starts video.
- [ ] A supported multi-scene answer generates one playable narrated MP4 with matching screenshots, captions, cursor targets, and narration timing. Forged or missing scenes cannot be rendered.
- [ ] Incomplete multi-tool coverage cannot produce a misleading combined tutorial.
- [ ] Relevant tests, type checking, production build, and a real visual/media spot check pass. Mocked model responses alone are insufficient to establish highlight or retrieval quality.

Useful commands from the repository root:

```powershell
pnpm install
pnpm prepare-assets
pnpm exec tsc --noEmit
pnpm test
pnpm build
```

For a fresh local server, prepare assets and run `pnpm exec next dev -p 3001` when that port is free. Keep production builds separate from an active development server using the same `.next` output. Configure OpenRouter through `.env` using `.env.example`; never include credentials in the handover or tracker.

**Review boundary:** This handover added documentation and copied/captured supporting evidence only. The current source was inspected and the scenario plus two questions were exercised through the live UI. Application tests/build and video rendering were not rerun for this documentation-only task. No application fix, asset review certification, or new feature is claimed complete.
