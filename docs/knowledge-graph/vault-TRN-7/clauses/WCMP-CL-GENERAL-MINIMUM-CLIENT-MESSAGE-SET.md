---
id: "clause:WCMP-CL-GENERAL-MINIMUM-CLIENT-MESSAGE-SET"
key: "WCMP-CL-GENERAL-MINIMUM-CLIENT-MESSAGE-SET"
type: "clause"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Support Destination Unreachable, Message Too Big, and Echo Reply in the minimum WDP-node WCMP message set.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRX-006|RQ-TRX-006]]
- `maps-to` → [[requirements/RQ-TRX-007|RQ-TRX-007]]
- `maps-to` → [[requirements/RQ-TRX-008|RQ-TRX-008]]
- `planned-by` → [[work-items/TRN-703|TRN-703]]
- `planned-by` → [[work-items/TRN-710|TRN-710]]
- `refines` → [[scr-rows/WCMP-GEN-C-001|WCMP-GEN-C-001]]
- `refines` → [[scr-rows/WCMP-GEN-C-003|WCMP-GEN-C-003]]
- `refines` → [[scr-rows/WCMP-GEN-C-006|WCMP-GEN-C-006]]
- `refines` → [[scr-rows/WCMP-SP-C-002|WCMP-SP-C-002]]
- `sourced-from` → [[source-documents/WAP-202-WCMP|WAP-202-WCMP]]
- `verified-by` → [[fixtures/WCMP-FX-GENERAL-MINIMUM-CLIENT-MESSAGE-SET|WCMP-FX-GENERAL-MINIMUM-CLIENT-MESSAGE-SET]]

## Data

```json
{
  "family": "wcmp",
  "parentRows": [
    "WCMP-SP-C-002",
    "WCMP-GEN-C-001",
    "WCMP-GEN-C-003",
    "WCMP-GEN-C-006"
  ],
  "sourceAnchor": {
    "documentId": "WAP-202-WCMP",
    "section": "5.2",
    "heading": "5.2. WCMP Conformance",
    "normalizedTextSha256": "4ef4829fe160989570d2b11816dec8635343b560b06608ed090902caffc99ba7"
  },
  "normativeForce": "table",
  "obligationLevel": "required",
  "profileApplicability": "capability-gated-non-ip-bearer",
  "obligationSynopsis": "Support Destination Unreachable, Message Too Big, and Echo Reply in the minimum WDP-node WCMP message set.",
  "workItems": [
    "T0-17",
    "TRN-703",
    "TRN-710"
  ],
  "ownerLayers": [
    "transport-rust"
  ],
  "requirementIds": [
    "RQ-TRX-006",
    "RQ-TRX-007",
    "RQ-TRX-008"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
