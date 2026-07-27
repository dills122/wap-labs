---
id: "clause:WMLSCRIPT-LIBRARIES-CL-URL-GET-FRAGMENT-SYNTAX-ERROR"
key: "WMLSCRIPT-LIBRARIES-CL-URL-GET-FRAGMENT-SYNTAX-ERROR"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Return invalid when fragment extraction encounters invalid URL syntax.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-016|RQ-WMLS-016]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `refines` → [[scr-rows/WMLSSL-078|WMLSSL-078]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-URL-GET-FRAGMENT-SYNTAX-ERROR|WMLSCRIPT-LIBRARIES-FX-URL-GET-FRAGMENT-SYNTAX-ERROR]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-078"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "10.8",
    "heading": "10.8 getFragment",
    "normalizedTextSha256": "a9ae81fd59dffe5d295dac3d00e459f9b774def56b5ac1d187dd1eab2e629b87"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Return invalid when fragment extraction encounters invalid URL syntax.",
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
