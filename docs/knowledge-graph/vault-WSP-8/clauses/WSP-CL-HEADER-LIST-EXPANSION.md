---
id: "clause:WSP-CL-HEADER-LIST-EXPANSION"
key: "WSP-CL-HEADER-LIST-EXPANSION"
type: "clause"
generated: true
slice: "WSP-8"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Expand an HTTP comma-list header into ordered repeated WSP fields before applying the well-known field encoding rule.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-014|RQ-TRN-014]]
- `planned-by` → [[work-items/WSP-802|WSP-802]]
- `refines` → [[scr-rows/WSP-CL-C-003|WSP-CL-C-003]]
- `sourced-from` → [[source-documents/WAP-203-WSP|WAP-203-WSP]]
- `verified-by` → [[fixtures/WSP-FX-HEADER-LIST-EXPANSION|WSP-FX-HEADER-LIST-EXPANSION]]

## Data

```json
{
  "family": "wsp",
  "parentRows": [
    "WSP-CL-C-003"
  ],
  "sourceAnchor": {
    "documentId": "WAP-203-WSP",
    "section": "8.4.1.3",
    "heading": "8.4.1.3 Encoding of list values",
    "normalizedTextSha256": "de2dde1d4ef943c1743c3397ab3bc1124f47cc94dcf99ab0a58cbea6c9e5cce3"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Expand an HTTP comma-list header into ordered repeated WSP fields before applying the well-known field encoding rule.",
  "workItems": [
    "T0-20",
    "WSP-802"
  ],
  "ownerLayers": [
    "transport-rust"
  ],
  "requirementIds": [
    "RQ-TRN-014"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
