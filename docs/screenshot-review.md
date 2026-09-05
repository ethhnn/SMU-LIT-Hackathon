# OpenLaw screenshot review

The original 11 PNGs in `Screenshots/LawNetScreenshots` were visually inspected on 5 September 2026. After merging the expanded screenshot collections, that directory contains 27 LawNet images, and `Screenshots/TAFEPScreenshots` contains 21 more. Asset preparation indexes all 48 files in `public/assets/screenshots/manifest.json` and writes their searchable filename keywords to `public/assets/screenshots/image-keywords.json`. The additional 38 images in `Screenshots/JudiciaryGovScreenshots` are collected source assets; runtime catalog integration and tutorial review are pending. Original files are not edited. Index inclusion is not manual verification of an interaction.

For each current question, OpenRouter searches every indexed image belonging to the applicable recommended or checked tools, then visually inspects a shortlist of up to six thumbnails. The full image path and dimensions are resolved by the server after selection. This replaces the earlier three-topic lookup while keeping the distinction between screenshot observation and a rehearsed action.

## Inventory

| Filename time | Visible state | Candidate use and limitation |
|---|---|---|
| 151841 | OpenLaw listing; search, decision-date range, current date filter, coram section | Orientation; active 1965–2026 date filter differs from later baseline captures |
| 151932 | Listing with sort dropdown: oldest-first, newest-first, title A–Z | Sorting help; no resulting changed order captured |
| 152003 | Search information button with Search Cheatsheet tooltip | Locating the search-help control |
| 152010 | Search Cheatsheet List modal showing syntax examples | Candidate next state for opening help; transition still needs rehearsal |
| 152024 | Listing with Legal Resources menu: MACO and Ethics | Navigation outside proposed judgment workflow |
| 152103 | Listing with Asian Insights menu: Podcasts and Latest News | Navigation outside proposed judgment workflow |
| 152139 | Ethics & Professional Standards Repository | Different product section; do not mix with OpenLaw action evidence |
| 152150 | Asian Insights regional counsel podcasts | Outside proposed judgment workflow |
| 152158 | Asian Insights preview and subscription sign-in | Outside proposed judgment workflow |
| 152211 | Support Hub and SAL id FAQ | General support, not judgment retrieval |
| 152224 | OpenLaw listing with expanded navigation | Orientation; controls shift relative to collapsed-navigation images |

## Findings

- Search, decision-date controls, coram controls, the sort menu, and the search cheatsheet are visible. This updates the earlier text-only source check.
- The page is already titled "Singapore Supreme Court Judgments." The illustrative "choose Supreme Court" instruction is not supported by these captures. No such court selector or generic right-hand Filters button is shown.
- Search help has a plausible before/after pair in 152003 and 152010. Sorting lacks the result of choosing a different order.
- No image shows a populated/submitted search, results for that query, or an opened judgment. Retrieval/download is not established.
- Expanding navigation shifts the search field, information button, and result cards. An annotation belongs to its exact captured image, not universal live-screen coordinates.
- These are candidate training assets. Reviewed instructions, tested actions, and a rehearsed workflow still need to be associated with them before claiming verified coverage.

## Proposed next evidence, pending workflow choice

For a judgment-location exercise: capture the clean starting state, a specific training query, submitted results, and the opened target judgment showing its identity/citation. Record the operation and expected result for each transition. Add filtering or sorting only if it contributes to the chosen objective.

Opening search help is the most immediately evidenced Help Clip candidate. Its instructional value should address a search difficulty rather than merely demonstrate a menu.

The confirmed target is [OpenLaw Supreme Court judgments](https://www.lawnet.com/openlaw/singapore/judgments/supreme-court). A repeat text-only web open returned the JavaScript-required shell; no live interaction was tested in this review.
