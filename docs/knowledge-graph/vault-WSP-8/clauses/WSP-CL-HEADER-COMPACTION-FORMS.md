---
id: "clause:WSP-CL-HEADER-COMPACTION-FORMS"
key: "WSP-CL-HEADER-COMPACTION-FORMS"
type: "clause"
generated: true
slice: "WSP-8"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Support well-known binary tokens, binary numeric/date/quality values, and mixed binary or text strings without losing header semantics.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-014|RQ-TRN-014]]
- `planned-by` → [[work-items/WSP-802|WSP-802]]
- `refines` → [[scr-rows/WSP-CL-C-003|WSP-CL-C-003]]
- `sourced-from` → [[source-documents/WAP-203-WSP|WAP-203-WSP]]
- `verified-by` → [[fixtures/WSP-FX-HEADER-COMPACTION-FORMS|WSP-FX-HEADER-COMPACTION-FORMS]]

## Data

```json
{
  "family": "wsp",
  "parentRows": [
    "WSP-CL-C-003"
  ],
  "sourceAnchor": {
    "documentId": "WAP-203-WSP",
    "section": "8.4.1",
    "heading": "8.4.1 General",
    "normalizedTextSha256": "f218a9a22f8fee9882d9ddc6d34a22d9c2f9f8675508f5ffde272d3bac08eeb2"
  },
  "normativeForce": "table",
  "obligationLevel": "required",
  "obligationSynopsis": "Support well-known binary tokens, binary numeric/date/quality values, and mixed binary or text strings without losing header semantics.",
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
