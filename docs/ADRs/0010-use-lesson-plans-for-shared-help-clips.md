---
status: accepted
---

# Use Lesson Plans for shared Help Clips

Recommendation cards remain scenario-driven discovery. The learner may check one or more cards as inputs to one shared Help Clip, but checking a card does not open an individual tutorial panel or establish a software handoff.

The application resolves a requested exact set of selected tool IDs to a manually curated Lesson Plan. A plan fixes the selected set and the ordered reviewed scenes, including the screenshots, highlights, cursor targets, expected states, and core instructions. The server issues a generation token only for that resolved plan and selected set. The renderer composes every plan scene into one MP4.

There is currently one manually reviewed plan: the OpenLaw-only Search-field scene. ADR 0011 also permits a signed, bounded sequence created from visually confirmed screenshot observations. A selection that includes Litera Compare, iManage, or any other uncovered combination shows an honest missing-coverage message and cannot start generation. Every selected tool needs at least one grounded scene before a combined video can be rendered.

OpenRouter may adapt supporting narration to the selected tools' curated roles and Help Focus. It must not invent actions, interfaces, or cross-tool handoffs. This keeps the shared-video concept defensible while allowing the renderer to support multi-scene plans later.
