# Tool evidence notes

Read-only source check: 5 September 2026. These findings identify candidate resources; they do not certify an end-to-end workflow or training assets.

## LawNet and OpenLaw

- The Singapore Academy of Law describes Open Law as an open-access repository of Supreme Court judgments. LawNet is the broader platform. Public OpenLaw guidance must not be represented as coverage of the complete paid research interface. Source: [SAL Research](https://sal.org.sg/research/).
- Following an official LawNet.sg link resolved to the [OpenLaw Supreme Court judgments entry point](https://www.lawnet.com/openlaw/singapore/judgments/supreme-court). The text extraction tool returned no usable interface content. Search, filters, sorting, judgment opening, and downloads were not interactively tested.
- [LawNet Research release notes](https://release-notes.lawnet.com/2024/10/15/research/) describe controls for Research subscribers. They do not establish that the same controls exist in public OpenLaw.

## Candidate training objective

Locate a specified judgment, confirm its name and citation, and open it. This is a proposed software-navigation objective, not a verified sequence and not a claim that the tutor has established legal relevance. The team must determine the exact operations through manual inspection before recording instructions or screenshots.

## Still needed

- Manual rehearsal in the actual public interface, including its starting state and final observable result.
- Checked screenshots or recordings and reviewed instructions for that sequence.
- Legitimate access and verified workflow evidence for a comparison tool, or a decision to use a clearly labeled mock internal tool.
- A person responsible for reviewing the demonstrated sequence and its cross-tool handoff.

No screenshots were captured in that initial source check. Authenticated product access and screenshot reuse terms were not established.

## Update after user-supplied screenshots

The user confirmed the exact OpenLaw entry URL. The original 11 OpenLaw captures were manually inspected; the supplied directories now contain 27 LawNet and 9 TAFEP screenshots. All 36 are included in the generated screenshot manifest and keyword index. Runtime OpenRouter selection visually checks shortlisted candidates, but neither indexing nor model inspection proves that the represented interaction was manually performed. See the [screenshot review](screenshot-review.md).

The first verified workflow target remains OpenLaw. TAFEP is now recommendation-eligible for screenshot-based guidance because the user supplied nine TAFEP captures. Cross-tool execution and combined multi-tool video remain deferred.
