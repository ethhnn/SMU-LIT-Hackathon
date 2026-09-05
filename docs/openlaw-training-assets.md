# OpenLaw training assets

This implementation records the current asset state for the only renderable Lesson Plan. It does not claim a completed Verified Workflow where evidence is still missing.

## Selected public judgment

- **Name:** Howe Wen Khong Rocky and others v Attorney-General
- **Citation:** [2026] SGCA 39
- **Training query:** `"Howe Wen Khong Rocky and others v Attorney-General"`
- **Public source entry:** <https://www.lawnet.com/openlaw/singapore/judgments/supreme-court>
- **Canonical judgment URL:** to be captured during the manual rehearsal; not guessed here.

The name and citation are visible in the supplied OpenLaw listing screenshot. The exercise is limited to locating and opening that judgment; it makes no claim about legal relevance.

## Asset manifest

| State | Asset | Status | Use |
|---|---|---|---|
| S0 | `lawnet-openlaw-judgments-expanded-sidebar.png` | Ready for the initial Help Clip | Locate the Search field in a 2047 × 1069 expanded-sidebar layout. |
| S1 | Populated Search field | Pending manual capture | Enter the supplied judgment name. |
| S2 | Search results with target title and citation | Pending manual capture | Run the search. |
| S3 | Opened target judgment with title and citation | Pending manual capture | Open the matching judgment. |

## Available highlight data

For S0, the Search field highlight is `x: 351`, `y: 214`, `width: 329`, `height: 60`; the cursor target is `x: 648`, `y: 243`. These native-image coordinates are scaled by the video renderer rather than reused as fixed browser coordinates.

## Reviewed core instruction available now

> Use the Search field in the left panel of the OpenLaw judgments page.

The manually reviewed OpenLaw Lesson Plan contains this available scene. Separately, the generated screenshot index lets OpenRouter select any supplied LawNet image for a clearly labelled screenshot-observation clip; that does not convert the image into a Verified Action or complete the four-step workflow. The remaining actions are still asset-capture and rehearsal pending. A combined selection cannot generate until every included tool has a scene in one plan.

## Manual capture handoff

Capture S1, S2, and S3 manually in the same 2047 × 1069 expanded-sidebar layout as S0. Record the exact screenshot filename, native dimensions, highlight rectangle, cursor target, expected result, and reviewed instruction for each state. Do not use browser automation or create a substitute interface image. After the four actions are rehearsed in order, update Ticket 01 before enabling those actions in the app.
