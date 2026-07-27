---
id: "clause:WMLSCRIPT-LIBRARIES-CL-URL-GET-PARAMETERS-SYNTAX-ERROR"
key: "WMLSCRIPT-LIBRARIES-CL-URL-GET-PARAMETERS-SYNTAX-ERROR"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Return invalid when parameter extraction encounters invalid URL syntax.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-016|RQ-WMLS-016]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `refines` → [[scr-rows/WMLSSL-076|WMLSSL-076]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-URL-GET-PARAMETERS-SYNTAX-ERROR|WMLSCRIPT-LIBRARIES-FX-URL-GET-PARAMETERS-SYNTAX-ERROR]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-076"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "10.6",
    "heading": "10.6 getParameters",
    "normalizedTextSha256": "28ae6e0a2f1a86fe57bfbf5afa486b43df60ad0abe72bcce7cf59832a1e05430"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Return invalid when parameter extraction encounters invalid URL syntax.",
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
