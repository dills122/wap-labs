---
id: "clause:WDP-CL-SIMULTANEOUS-INSTANCES"
key: "WDP-CL-SIMULTANEOUS-INSTANCES"
type: "clause"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Use port numbers to multiplex multiple simultaneous higher-layer communication instances over one WDP bearer service.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-001|RQ-TRN-001]]
- `maps-to` → [[requirements/RQ-TRN-003|RQ-TRN-003]]
- `planned-by` → [[work-items/TRN-701|TRN-701]]
- `refines` → [[scr-rows/WDP-C-001|WDP-C-001]]
- `refines` → [[scr-rows/WDP-CORE-C-001|WDP-CORE-C-001]]
- `refines` → [[scr-rows/WDP-NA-C-006|WDP-NA-C-006]]
- `refines` → [[scr-rows/WDP-NA-C-007|WDP-NA-C-007]]
- `sourced-from` → [[source-documents/WAP-200-WDP|WAP-200-WDP]]
- `verified-by` → [[fixtures/WDP-FX-SIMULTANEOUS-INSTANCES|WDP-FX-SIMULTANEOUS-INSTANCES]]

## Data

```json
{
  "family": "wdp",
  "parentRows": [
    "WDP-C-001",
    "WDP-CORE-C-001",
    "WDP-NA-C-006",
    "WDP-NA-C-007"
  ],
  "sourceAnchor": {
    "documentId": "WAP-200-WDP",
    "section": "5.2",
    "heading": "5.2 General Description of the WDP Protocol",
    "normalizedTextSha256": "14902abbfd7f1264fd59ecd5ee90d8c4910061e8475f7e44450e5eee08969899"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Use port numbers to multiplex multiple simultaneous higher-layer communication instances over one WDP bearer service.",
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
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
