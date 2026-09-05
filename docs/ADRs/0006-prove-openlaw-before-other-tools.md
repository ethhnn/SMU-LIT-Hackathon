---
status: accepted
---

# Prove the OpenLaw workflow before adding other tools

The first prototype will focus on LawNet's public OpenLaw Supreme Court judgments interface at https://www.lawnet.com/openlaw/singapore/judgments/supreme-court, confirmed by the user. Other tools and cross-tool workflows are deferred until this prototype works. This revises the earlier cross-tool-first priority and concentrates the available training evidence and implementation effort on one tool.

The intended target is a four-action judgment-location workflow, ending with opening a judgment by its supplied name. The supplied evidence currently verifies only the initial Search-field action; populated-search, results, and opened-judgment states still require capture and end-to-end rehearsal. The app must not describe the full workflow as verified. ADR 0011 permits separately labelled contextual clips selected from supplied screenshots without upgrading observations to Verified Actions. TAFEP was later added to the recommendation catalog because nine TAFEP screenshots are now supplied, but it does not replace OpenLaw as the first end-to-end workflow target. The shared composer cannot claim cross-tool training or generate a combined clip until every selected tool has a scene.

Accepted from the user's latest scope instruction and confirmed URL. Team capacity remains unresolved; the user has nevertheless explicitly selected the first tool.
