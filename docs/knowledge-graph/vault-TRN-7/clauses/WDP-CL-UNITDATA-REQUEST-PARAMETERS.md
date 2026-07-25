---
id: "clause:WDP-CL-UNITDATA-REQUEST-PARAMETERS"
key: "WDP-CL-UNITDATA-REQUEST-PARAMETERS"
type: "clause"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Require source address, source port, destination address, destination port, and user data on every T-DUnitdata request.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-001|RQ-TRN-001]]
- `maps-to` → [[requirements/RQ-TRN-003|RQ-TRN-003]]
- `planned-by` → [[work-items/TRN-701|TRN-701]]
- `refines` → [[scr-rows/WDP-CORE-C-001|WDP-CORE-C-001]]
- `refines` → [[scr-rows/WDP-NA-C-000|WDP-NA-C-000]]
- `refines` → [[scr-rows/WDP-NA-C-003|WDP-NA-C-003]]
- `refines` → [[scr-rows/WDP-NA-C-006|WDP-NA-C-006]]
- `refines` → [[scr-rows/WDP-NA-C-007|WDP-NA-C-007]]
- `refines` → [[scr-rows/WDP-PF-C-001|WDP-PF-C-001]]
- `sourced-from` → [[source-documents/WAP-200-WDP|WAP-200-WDP]]
- `verified-by` → [[fixtures/WDP-FX-UNITDATA-REQUEST-PARAMETERS|WDP-FX-UNITDATA-REQUEST-PARAMETERS]]

## Data

```json
{
  "family": "wdp",
  "parentRows": [
    "WDP-CORE-C-001",
    "WDP-PF-C-001",
    "WDP-NA-C-000",
    "WDP-NA-C-003",
    "WDP-NA-C-006",
    "WDP-NA-C-007"
  ],
  "sourceAnchor": {
    "documentId": "WAP-200-WDP",
    "section": "6.3.1.1",
    "heading": "6.3.1.1 T-DUnitdata",
    "normalizedTextSha256": "76d94ea7202df89c189f507b1521fd9abac2c9685d334aa0723fc4dc2a574793"
  },
  "normativeForce": "table",
  "obligationLevel": "required",
  "obligationSynopsis": "Require source address, source port, destination address, destination port, and user data on every T-DUnitdata request.",
  "workItems": [
    "T0-19",
    "TRN-701"
  ],
  "ownerLayers": [
    "transport-rust"
  ],
  "requirementIds": [
    "RQ-TRN-001",
    "RQ-TRN-003"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
