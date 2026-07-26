---
id: "clause:WSP-CL-UNITDATA-DIRECT-MAPPING"
key: "WSP-CL-UNITDATA-DIRECT-MAPPING"
type: "clause"
generated: true
slice: "WSP-8"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Map each connectionless service request directly to one WSP PDU sent by an underlying Unitdata request, without a WSP state machine.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-010|RQ-TRN-010]]
- `planned-by` → [[work-items/WSP-801|WSP-801]]
- `refines` → [[scr-rows/WSP-C-001|WSP-C-001]]
- `refines` → [[scr-rows/WSP-CL-C-001|WSP-CL-C-001]]
- `sourced-from` → [[source-documents/WAP-203-WSP|WAP-203-WSP]]
- `verified-by` → [[fixtures/WSP-FX-UNITDATA-DIRECT-MAPPING|WSP-FX-UNITDATA-DIRECT-MAPPING]]

## Data

```json
{
  "family": "wsp",
  "parentRows": [
    "WSP-C-001",
    "WSP-CL-C-001"
  ],
  "sourceAnchor": {
    "documentId": "WAP-203-WSP",
    "section": "7.2",
    "heading": "7.2 Connectionless WSP",
    "normalizedTextSha256": "46b854c21e7aea34ecb93e11d204cafa6349651d7a3b27f8b0673633798f4e63"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Map each connectionless service request directly to one WSP PDU sent by an underlying Unitdata request, without a WSP state machine.",
  "workItems": [
    "T0-09",
    "WSP-801"
  ],
  "ownerLayers": [
    "transport-rust"
  ],
  "requirementIds": [
    "RQ-TRN-010"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
