---
status: accepted
---

# Base MVP support on reviewed training evidence

The original proposal uses live website inspection to repair gaps or stale screenshots. The initial MVP will instead use a bounded library of supplied interface screenshots and reviewed action records, with an explicit fallback when no supplied evidence supports the question. Evidence status remains visible: a manually tested action is a reviewed instruction, while a control that is merely visible in a supplied image is a screenshot observation and must not be described as a verified interaction. This trades coverage and automatic adaptation for a smaller, reviewable demonstration.

Real products require legitimate interface access and verification of the demonstrated workflow. An explicitly labeled mock internal tool is an acceptable alternative; it must not imply a live integration with an inaccessible commercial product. Manual inspection to author training materials remains allowed; runtime live website inspection is outside this MVP.

The exact support record, rules for composing actions, and fallback behavior remain open. This decision does not claim that every combination of individually tested actions is valid.

Accepted from the user's round-1 answer on 5 September 2026.
