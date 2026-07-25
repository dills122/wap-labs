---
id: "clause:WDP-CL-PROTOCOL-REQUIRED-PORT-FIELDS"
key: "WDP-CL-PROTOCOL-REQUIRED-PORT-FIELDS"
type: "clause"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Carry both destination and source port fields in the selected WDP protocol mapping.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-001|RQ-TRN-001]]
- `maps-to` → [[requirements/RQ-TRN-003|RQ-TRN-003]]
- `planned-by` → [[work-items/TRN-701|TRN-701]]
- `refines` → [[scr-rows/WDP-CORE-C-001|WDP-CORE-C-001]]
- `refines` → [[scr-rows/WDP-NA-C-006|WDP-NA-C-006]]
- `refines` → [[scr-rows/WDP-NA-C-007|WDP-NA-C-007]]
- `sourced-from` → [[source-documents/WAP-200-WDP|WAP-200-WDP]]
- `verified-by` → [[fixtures/WDP-FX-PROTOCOL-REQUIRED-PORT-FIELDS|WDP-FX-PROTOCOL-REQUIRED-PORT-FIELDS]]

## Data

```json
{
  "family": "wdp",
  "parentRows": [
    "WDP-CORE-C-001",
    "WDP-NA-C-006",
    "WDP-NA-C-007"
  ],
  "sourceAnchor": {
    "documentId": "WAP-200-WDP",
    "section": "7.1",
    "heading": "7.1 Introduction",
    "normalizedTextSha256": "68c81ae574eaed15ac271251ecc849295f104c7cc48345709e42f02017b9ee2c"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Carry both destination and source port fields in the selected WDP protocol mapping.",
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
