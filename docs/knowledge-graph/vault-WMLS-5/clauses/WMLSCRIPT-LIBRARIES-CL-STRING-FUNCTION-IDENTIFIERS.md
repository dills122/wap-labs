---
id: "clause:WMLSCRIPT-LIBRARIES-CL-STRING-FUNCTION-IDENTIFIERS"
key: "WMLSCRIPT-LIBRARIES-CL-STRING-FUNCTION-IDENTIFIERS"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Map string function identifiers exactly as follows: length=0, isEmpty=1, charAt=2, subString=3, find=4, replace=5, elements=6, elementAt=7, removeAt=8, replaceAt=9, insertAt=10, squeeze=11, trim=12, compare=13, toString=14, format=15.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-015|RQ-WMLS-015]]
- `planned-by` → [[work-items/WMLS-501|WMLS-501]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `refines` → [[scr-rows/WMLSSL-020|WMLSSL-020]]
- `refines` → [[scr-rows/WMLSSL-027|WMLSSL-027]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-STRING-FUNCTION-IDENTIFIERS|WMLSCRIPT-LIBRARIES-FX-STRING-FUNCTION-IDENTIFIERS]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-020",
    "WMLSSL-027"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "appendix-a",
    "heading": "Appendix A. Library Summary",
    "normalizedTextSha256": "218c9f4b348c0a1b15edf3f6d8ee74e2c1f899160cf6525c8e2adeeb3b48a215"
  },
  "normativeForce": "table",
  "obligationLevel": "required",
  "obligationSynopsis": "Map string function identifiers exactly as follows: length=0, isEmpty=1, charAt=2, subString=3, find=4, replace=5, elements=6, elementAt=7, removeAt=8, replaceAt=9, insertAt=10, squeeze=11, trim=12, compare=13, toString=14, format=15.",
  "workItems": [
    "W1-05",
    "WMLS-501",
    "WMLS-504"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-015"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
