---
id: "clause:WMLSCRIPT-LIBRARIES-CL-URL-GET-HOST-SYNTAX-ERROR"
key: "WMLSCRIPT-LIBRARIES-CL-URL-GET-HOST-SYNTAX-ERROR"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Return invalid when host extraction encounters invalid URL syntax.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-016|RQ-WMLS-016]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `refines` → [[scr-rows/WMLSSL-073|WMLSSL-073]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-URL-GET-HOST-SYNTAX-ERROR|WMLSCRIPT-LIBRARIES-FX-URL-GET-HOST-SYNTAX-ERROR]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-073"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "10.3",
    "heading": "10.3 getHost",
    "normalizedTextSha256": "0193244bd2d29fedf22a6190836ae7a1f0f73231c7a78556f1b8498f913074fe"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Return invalid when host extraction encounters invalid URL syntax.",
  "workItems": [
    "W1-05",
    "WMLS-504"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-016"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
