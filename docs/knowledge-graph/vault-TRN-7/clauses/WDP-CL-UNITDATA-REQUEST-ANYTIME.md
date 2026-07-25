---
id: "clause:WDP-CL-UNITDATA-REQUEST-ANYTIME"
key: "WDP-CL-UNITDATA-REQUEST-ANYTIME"
type: "clause"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Allow T-DUnitdata.request without establishing a prior transport connection.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-001|RQ-TRN-001]]
- `planned-by` → [[work-items/TRN-701|TRN-701]]
- `planned-by` → [[work-items/TRN-707|TRN-707]]
- `refines` → [[scr-rows/WDP-PF-C-001|WDP-PF-C-001]]
- `sourced-from` → [[source-documents/WAP-200-WDP|WAP-200-WDP]]
- `verified-by` → [[fixtures/WDP-FX-UNITDATA-REQUEST-ANYTIME|WDP-FX-UNITDATA-REQUEST-ANYTIME]]

## Data

```json
{
  "family": "wdp",
  "parentRows": [
    "WDP-PF-C-001"
  ],
  "sourceAnchor": {
    "documentId": "WAP-200-WDP",
    "section": "6.3.1.1",
    "heading": "6.3.1.1 T-DUnitdata",
    "normalizedTextSha256": "76d94ea7202df89c189f507b1521fd9abac2c9685d334aa0723fc4dc2a574793"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Allow T-DUnitdata.request without establishing a prior transport connection.",
  "workItems": [
    "T0-19",
    "TRN-701",
    "TRN-707"
  ],
  "ownerLayers": [
    "transport-rust"
  ],
  "requirementIds": [
    "RQ-TRN-001"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
