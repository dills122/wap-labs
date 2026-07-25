---
id: "clause:WCMP-CL-NO-ERROR-TO-ERROR"
key: "WCMP-CL-NO-ERROR-TO-ERROR"
type: "clause"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Never generate a WCMP error message in response to another WCMP error message.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRX-006|RQ-TRX-006]]
- `planned-by` → [[work-items/TRN-703|TRN-703]]
- `refines` → [[scr-rows/WCMP-C-001|WCMP-C-001]]
- `refines` → [[scr-rows/WCMP-SP-C-002|WCMP-SP-C-002]]
- `sourced-from` → [[source-documents/WAP-202-WCMP|WAP-202-WCMP]]
- `verified-by` → [[fixtures/WCMP-FX-NO-ERROR-TO-ERROR|WCMP-FX-NO-ERROR-TO-ERROR]]

## Data

```json
{
  "family": "wcmp",
  "parentRows": [
    "WCMP-C-001",
    "WCMP-SP-C-002"
  ],
  "sourceAnchor": {
    "documentId": "WAP-202-WCMP",
    "section": "5.1",
    "heading": "5.1. General",
    "normalizedTextSha256": "c2cd925db8f2b2273f57296606cd9c43592a25924a80f6a6fe2b44d626d836c6"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Never generate a WCMP error message in response to another WCMP error message.",
  "workItems": [
    "T0-17",
    "TRN-703"
  ],
  "ownerLayers": [
    "transport-rust"
  ],
  "requirementIds": [
    "RQ-TRX-006"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
