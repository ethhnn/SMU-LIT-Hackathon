---
status: accepted
---

# Use indexed screenshot evidence for contextual teaching turns

The contextual question area behaves as a continuing teaching conversation. Each question appends its own answer, evidence label, screenshot guidance, video coverage, and optional explicitly generated clip. Initial and earlier teaching remain visible.

The contextual composer remains available after recommendations even when no video-tool checkbox is selected. Checked tools narrow the question context; otherwise the ordered recommendations supply it. Every supplied LawNet and TAFEP image is copied into a generated manifest and filename-keyword JSON index. OpenRouter searches the complete applicable index using the scenario, current question, and recent conversation, then visually inspects up to six candidates. A separate vision pass finds a tight highlight on the selected image. There is no fixed question-to-answer or question-to-image map.

A screenshot observation may produce an explicitly requested clip from the minimum useful ordered sequence of one to three confirmed images, with narration and UI labels stating that the evidence is supplied rather than a rehearsed live interaction. Narrow questions normally use one image. Broader objectives may first show how to reach a feature and then continue through the relevant destination page, controls, or filters. If the model finds no suitable image, the answer remains text-only and video coverage is unavailable. The original static Support Topic remains only for the manually reviewed OpenLaw Search-field demo.

Question-bound Help Clip tokens include the scenario, resolved tool IDs, exact question, ordered screenshot IDs, image-grounded instructions, captions, and highlights. The server verifies the signature and re-resolves every original image before rendering. A checked multi-tool shared clip requires at least one grounded scene for every selected tool; a contextual screenshot answer does not fabricate a cross-tool handoff. The contextual model receives at most the latest three complete question-and-answer turns by default, configured through `NEXT_PUBLIC_CONTEXTUAL_QUESTION_WINDOW`; older turns remain visible in the browser. Previously displayed screenshot IDs are passed separately so that a newly named page or feature can supersede the earlier visual context.
