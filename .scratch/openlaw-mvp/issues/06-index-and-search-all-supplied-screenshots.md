# 06 — Index and search all supplied screenshots

**What to build:** Replace the three-topic contextual image lookup with a generated JSON index covering every supplied screenshot for AI-recommended or learner-checked tools.

**Blocked by:** None — can start immediately.

**Status:** complete

- [x] Copy all 27 LawNet and 9 TAFEP images into stable public asset paths.
- [x] Generate `image-keywords.json` and a full manifest from filenames, tools, dimensions, original images, and thumbnails.
- [x] Add TAFEP to the curated recommendation catalog now that its screenshot assets are supplied.
- [x] Search the complete applicable keyword index using the scenario, current question, and latest three Q&A turns.
- [x] Let OpenRouter visually inspect shortlisted images and select the best exact image ID without a question-specific mapping.
- [x] Use a second vision pass to locate the relevant control and keep the full-resolution asset path server-controlled.
- [x] Carry the generated screenshot scene in a signed token and reject substituted images, tools, questions, or plans.
- [x] Use the same dynamic selector for section 3 instead of always showing the Search-field image.
- [x] Simplify section 3 so it does not repeat the full objective, recommendation order, or numbered selected-tool names.
- [x] Verify LawNet Legal Resources and TAFEP follow-up questions select relevant supplied images.
- [x] Verify a real dynamic screenshot clip contains playable H.264 video and AAC narration.

No browser automation, progress tracking, generated replacement interface, or claim of verified interaction is included.
