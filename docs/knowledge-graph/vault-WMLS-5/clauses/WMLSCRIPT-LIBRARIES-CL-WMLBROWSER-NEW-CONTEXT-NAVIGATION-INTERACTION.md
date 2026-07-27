---
id: "clause:WMLSCRIPT-LIBRARIES-CL-WMLBROWSER-NEW-CONTEXT-NAVIGATION-INTERACTION"
key: "WMLSCRIPT-LIBRARIES-CL-WMLBROWSER-NEW-CONTEXT-NAVIGATION-INTERACTION"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Preserve a pending go request while ensuring any previous or subsequent prev request has no effect.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-019|RQ-WMLS-019]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `planned-by` → [[work-items/WMLS-505|WMLS-505]]
- `refines` → [[scr-rows/WMLSSL-089|WMLSSL-089]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-WMLBROWSER-NEW-CONTEXT-NAVIGATION-INTERACTION|WMLSCRIPT-LIBRARIES-FX-WMLBROWSER-NEW-CONTEXT-NAVIGATION-INTERACTION]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-089"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "11.5",
    "heading": "11.5 newContext",
    "normalizedTextSha256": "13381ef408e15b8335ca31bfa18e044febb8978c81a7d7e678d7ec5b4b6626ab"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Preserve a pending go request while ensuring any previous or subsequent prev request has no effect.",
  "workItems": [
    "W0-07",
    "W1-05",
    "WMLS-504",
    "WMLS-505"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-019"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
