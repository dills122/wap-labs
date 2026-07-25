---
id: "clause:WCMP-CL-SELECTED-TYPE-CODE-VALUES"
key: "WCMP-CL-SELECTED-TYPE-CODE-VALUES"
type: "clause"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Recognize Destination Unreachable type 51, Message Too Big type 60 code 0, and Echo Reply type 179 code 0.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRX-006|RQ-TRX-006]]
- `maps-to` → [[requirements/RQ-TRX-007|RQ-TRX-007]]
- `maps-to` → [[requirements/RQ-TRX-008|RQ-TRX-008]]
- `planned-by` → [[work-items/TRN-703|TRN-703]]
- `planned-by` → [[work-items/TRN-707|TRN-707]]
- `refines` → [[scr-rows/WCMP-GEN-C-001|WCMP-GEN-C-001]]
- `refines` → [[scr-rows/WCMP-GEN-C-003|WCMP-GEN-C-003]]
- `refines` → [[scr-rows/WCMP-GEN-C-006|WCMP-GEN-C-006]]
- `sourced-from` → [[source-documents/WAP-202-WCMP|WAP-202-WCMP]]
- `verified-by` → [[fixtures/WCMP-FX-SELECTED-TYPE-CODE-VALUES|WCMP-FX-SELECTED-TYPE-CODE-VALUES]]

## Data

```json
{
  "family": "wcmp",
  "parentRows": [
    "WCMP-GEN-C-001",
    "WCMP-GEN-C-003",
    "WCMP-GEN-C-006"
  ],
  "sourceAnchor": {
    "documentId": "WAP-202-WCMP",
    "section": "5.5.1",
    "heading": "5.5.1. General Message Structure",
    "normalizedTextSha256": "19eaab848ccc4d8296d1c3389e34294e656e7dbcb9a61bb69ab28a2f178912f2"
  },
  "normativeForce": "table",
  "obligationLevel": "required",
  "obligationSynopsis": "Recognize Destination Unreachable type 51, Message Too Big type 60 code 0, and Echo Reply type 179 code 0.",
  "workItems": [
    "T0-17",
    "TRN-703",
    "TRN-707"
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
