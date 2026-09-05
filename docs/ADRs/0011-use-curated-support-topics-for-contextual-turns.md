---
status: accepted
---

# Use indexed screenshot evidence for contextual teaching turns

The contextual question area behaves as a continuing teaching conversation. Each question appends its own answer, evidence label, screenshot guidance, video coverage, and optional explicitly generated clip. Initial and earlier teaching remain visible.

The contextual composer remains available after recommendations even when no video-tool checkbox is selected. Checked tools narrow the question context; otherwise the ordered recommendations supply it. Every supplied LawNet and TAFEP image is copied into a generated manifest and filename-keyword JSON index. OpenRouter searches the complete applicable index using the scenario, current question, and recent conversation, then visually inspects up to six candidates. A separate vision pass finds a tight highlight on the selected image. There is no fixed question-to-answer or question-to-image map.

A screenshot observation may produce an explicitly requested clip from that same image, with narration and UI labels stating that the evidence is supplied rather than a rehearsed live interaction. If the model finds no suitable image, the answer remains text-only and video coverage is unavailable. The original static Support Topic remains only for the manually reviewed OpenLaw Search-field demo.

Question-bound Help Clip tokens include the scenario, resolved tool IDs, exact question, selected screenshot ID, image-grounded instruction, caption, and highlight. The server verifies the signature and re-resolves the original image before rendering. A checked multi-tool shared clip still requires scenes for every selected tool; a contextual screenshot answer does not fabricate a combined sequence. The contextual model receives at most the latest three complete question-and-answer turns by default, configured through `NEXT_PUBLIC_CONTEXTUAL_QUESTION_WINDOW`; older turns remain visible in the browser.
