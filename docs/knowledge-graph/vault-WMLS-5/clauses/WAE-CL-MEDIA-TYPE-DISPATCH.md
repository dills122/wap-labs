---
id: "clause:WAE-CL-MEDIA-TYPE-DISPATCH"
key: "WAE-CL-MEDIA-TYPE-DISPATCH"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Dispatch WAE content according to its media type so the responsible decoder or interpreter applies that format structure and semantics.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WAE-001|RQ-WAE-001]]
- `maps-to` → [[requirements/RQ-WAE-003|RQ-WAE-003]]
- `maps-to` → [[requirements/RQ-WAE-005|RQ-WAE-005]]
- `maps-to` → [[requirements/RQ-WMLS-011|RQ-WMLS-011]]
- `planned-by` → [[work-items/WMLS-503|WMLS-503]]
- `refines` → [[scr-rows/WAESpec-C-019|WAESpec-C-019]]
- `refines` → [[scr-rows/WAESpec-C-020|WAESpec-C-020]]
- `refines` → [[scr-rows/WAESpec-C-021|WAESpec-C-021]]
- `sourced-from` → [[source-documents/WAP-190-WAESpec|WAP-190-WAESpec]]
- `verified-by` → [[fixtures/WAE-FX-MEDIA-TYPE-DISPATCH|WAE-FX-MEDIA-TYPE-DISPATCH]]

## Data

```json
{
  "family": "wae",
  "parentRows": [
    "WAESpec-C-019",
    "WAESpec-C-020",
    "WAESpec-C-021"
  ],
  "sourceAnchor": {
    "documentId": "WAP-190-WAESpec",
    "section": "5.1.8",
    "heading": "5.1.8 WAE Media Types",
    "normalizedTextSha256": "f1ddc7339875ee9ba4e3dfe485244ae61fc365b0063b5051e179d6ed9686d259"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Dispatch WAE content according to its media type so the responsible decoder or interpreter applies that format structure and semantics.",
  "workItems": [
    "R0-08",
    "T0-07",
    "W1-01",
    "WAE-602",
    "WMLS-503"
  ],
  "ownerLayers": [
    "browser",
    "engine-wasm",
    "transport-rust"
  ],
  "requirementIds": [
    "RQ-WAE-001",
    "RQ-WAE-003",
    "RQ-WAE-005",
    "RQ-WMLS-011"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
