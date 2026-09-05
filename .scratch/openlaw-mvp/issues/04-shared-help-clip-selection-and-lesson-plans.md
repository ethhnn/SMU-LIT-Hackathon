# 04 — Shared Help Clip selection and Lesson Plans

**What to build:** Replace individual tool exploration and per-tool Help Clip controls with accessible recommendation-card checkboxes and one shared Help Clip composer backed by manually curated Lesson Plans.

**Blocked by:** None — can start immediately.

**Status:** complete

- [x] Replace Explore controls with checkboxes labelled “Include in shared Help Clip”; retain scenario-specific order, pros, limits, and coverage labels.
- [x] Clear selected tools, Help Focus question, guidance, and any generated clip when a learner submits a new scenario.
- [x] Place one selected-tool summary, coverage response, and Generate shared Help Clip control above the grouped contextual-question field.
- [x] Remove individual application-help panels and individual Help Clip buttons.
- [x] Add the Lesson Plan model with exact selected tool IDs and an ordered list of reviewed scenes.
- [x] Restrict generation to a server-resolved plan and token bound to that plan and selected set; reject forged uncovered combinations.
- [x] Keep OpenLaw's reviewed Search-field scene as the only current renderable plan and show honest missing-coverage messages for every multi-tool selection.
- [x] Update the renderer to compose the ordered scene list into one narrated “Training demonstration” MP4.
- [x] Verify the user-facing selection behavior, question payload, coverage gating, forged-request rejection, and real OpenLaw-only MP4 path.

Adding Litera Compare, iManage, or another multi-tool video is not part of this ticket. It needs reviewed screenshots, instructions, scenes, and an explicit Lesson Plan before generation can be enabled.
