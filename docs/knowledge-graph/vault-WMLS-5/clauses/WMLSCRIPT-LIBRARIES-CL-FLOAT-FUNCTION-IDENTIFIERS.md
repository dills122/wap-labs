---
id: "clause:WMLSCRIPT-LIBRARIES-CL-FLOAT-FUNCTION-IDENTIFIERS"
key: "WMLSCRIPT-LIBRARIES-CL-FLOAT-FUNCTION-IDENTIFIERS"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Map float function identifiers exactly as follows: int=0, floor=1, ceil=2, pow=3, round=4, sqrt=5, maxFloat=6, minFloat=7.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-007|RQ-WMLS-007]]
- `maps-to` → [[requirements/RQ-WMLS-012|RQ-WMLS-012]]
- `maps-to` → [[requirements/RQ-WMLS-014|RQ-WMLS-014]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `refines` → [[scr-rows/WMLSSL-019|WMLSSL-019]]
- `refines` → [[scr-rows/WMLSSL-026|WMLSSL-026]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-FLOAT-FUNCTION-IDENTIFIERS|WMLSCRIPT-LIBRARIES-FX-FLOAT-FUNCTION-IDENTIFIERS]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-019",
    "WMLSSL-026"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "appendix-a",
    "heading": "Appendix A. Library Summary",
    "normalizedTextSha256": "218c9f4b348c0a1b15edf3f6d8ee74e2c1f899160cf6525c8e2adeeb3b48a215"
  },
  "normativeForce": "table",
  "obligationLevel": "required",
  "obligationSynopsis": "Map float function identifiers exactly as follows: int=0, floor=1, ceil=2, pow=3, round=4, sqrt=5, maxFloat=6, minFloat=7.",
  "workItems": [
    "W1-05",
    "WMLS-504"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-007",
    "RQ-WMLS-012",
    "RQ-WMLS-014"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
