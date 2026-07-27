---
id: "clause:WMLSCRIPT-LIBRARIES-CL-STRING-TRIM-BEHAVIOR"
key: "WMLSCRIPT-LIBRARIES-CL-STRING-TRIM-BEHAVIOR"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Remove every leading and trailing TAB, VT, FF, space, LF, and CR while preserving internal whitespace.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-015|RQ-WMLS-015]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `refines` → [[scr-rows/WMLSSL-067|WMLSSL-067]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-STRING-TRIM-BEHAVIOR|WMLSCRIPT-LIBRARIES-FX-STRING-TRIM-BEHAVIOR]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-067"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "9.13",
    "heading": "9.13 trim",
    "normalizedTextSha256": "63fd87096dabe2d3d1cab52014728d15a8d9cc1b4c583df7e0941ef019c18f2b"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Remove every leading and trailing TAB, VT, FF, space, LF, and CR while preserving internal whitespace.",
  "workItems": [
    "W1-05",
    "WMLS-504"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-015"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
