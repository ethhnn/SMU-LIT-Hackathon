---
status: accepted
---

# Constrain AI guidance to reviewed workflows

The MVP will support one manually reviewed workflow tested end-to-end. AI may explain it, adapt wording, select verified steps, and produce narration and captions, but may not invent operations, reorder required dependencies, or assume untested handoffs. This gives up arbitrary workflow planning in exchange for instructions whose operational content can be reviewed and demonstrated.

Unsupported tool combinations receive an explanation of the capability gap, not an invented workflow or tutorial. When the learner reports an interface mismatch, clarification may use a non-confidential description and a supplied training screen. ADR 0011 refines the media boundary: OpenRouter may select one curated screenshot topic for the current question, and the server may render that fixed screenshot observation into an explicitly requested clip. Such a clip remains labelled as screenshot evidence and cannot claim a verified interaction, expected transition, or cross-tool workflow.

Accepted in the user's round-2 answers. The latest boundary resolves the prototype approach: manually written reviewed core instructions remain intact, with generated supporting explanation around them. A complex narration-validation system is explicitly unnecessary for this hackathon demonstration.
