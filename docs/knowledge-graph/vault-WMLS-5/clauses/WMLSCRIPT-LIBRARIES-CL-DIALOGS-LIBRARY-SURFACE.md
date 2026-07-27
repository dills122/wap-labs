---
id: "clause:WMLSCRIPT-LIBRARIES-CL-DIALOGS-LIBRARY-SURFACE"
key: "WMLSCRIPT-LIBRARIES-CL-DIALOGS-LIBRARY-SURFACE"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Expose the complete dialogs standard-library namespace and its selected functions through the WMLScript library-call boundary.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-022|RQ-WMLS-022]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `refines` → [[scr-rows/WMLSSL-023|WMLSSL-023]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-DIALOGS-LIBRARY-SURFACE|WMLSCRIPT-LIBRARIES-FX-DIALOGS-LIBRARY-SURFACE]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-023"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "12",
    "heading": "12.   DIALOGS",
    "normalizedTextSha256": "d250d6c552fe1f0a5b9b9c9870bc0265d2aa59e2ed888c9e205dd84474646371"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Expose the complete dialogs standard-library namespace and its selected functions through the WMLScript library-call boundary.",
  "workItems": [
    "W1-05",
    "WMLS-504"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-022"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
