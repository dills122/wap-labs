---
id: "clause:WDP-CL-ADAPTATION-LAYER-BOUNDARY"
key: "WDP-CL-ADAPTATION-LAYER-BOUNDARY"
type: "clause"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Terminate bearer-specific adaptation at the WDP boundary without changing the service presented to WSP or other upper layers.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-001|RQ-TRN-001]]
- `maps-to` → [[requirements/RQ-TRN-002|RQ-TRN-002]]
- `planned-by` → [[work-items/TRN-701|TRN-701]]
- `refines` → [[scr-rows/WDP-C-001|WDP-C-001]]
- `refines` → [[scr-rows/WDP-CT-C-002|WDP-CT-C-002]]
- `sourced-from` → [[source-documents/WAP-200-WDP|WAP-200-WDP]]
- `verified-by` → [[fixtures/WDP-FX-ADAPTATION-LAYER-BOUNDARY|WDP-FX-ADAPTATION-LAYER-BOUNDARY]]

## Data

```json
{
  "family": "wdp",
  "parentRows": [
    "WDP-C-001",
    "WDP-CT-C-002"
  ],
  "sourceAnchor": {
    "documentId": "WAP-200-WDP",
    "section": "5.2",
    "heading": "5.2 General Description of the WDP Protocol",
    "normalizedTextSha256": "14902abbfd7f1264fd59ecd5ee90d8c4910061e8475f7e44450e5eee08969899"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Terminate bearer-specific adaptation at the WDP boundary without changing the service presented to WSP or other upper layers.",
  "workItems": [
    "T0-19",
    "TRN-701"
  ],
  "ownerLayers": [
    "transport-rust"
  ],
  "requirementIds": [
    "RQ-TRN-001",
    "RQ-TRN-002"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
