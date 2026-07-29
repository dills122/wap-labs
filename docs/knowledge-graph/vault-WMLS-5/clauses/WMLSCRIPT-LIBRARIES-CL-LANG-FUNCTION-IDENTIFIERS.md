---
id: "clause:WMLSCRIPT-LIBRARIES-CL-LANG-FUNCTION-IDENTIFIERS"
key: "WMLSCRIPT-LIBRARIES-CL-LANG-FUNCTION-IDENTIFIERS"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Map lang function identifiers exactly as follows: abs=0, min=1, max=2, parseInt=3, parseFloat=4, isInt=5, isFloat=6, maxInt=7, minInt=8, float=9, exit=10, abort=11, random=12, seed=13, characterSet=14.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-013|RQ-WMLS-013]]
- `planned-by` → [[work-items/WMLS-501|WMLS-501]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `refines` → [[scr-rows/WMLSSL-018|WMLSSL-018]]
- `refines` → [[scr-rows/WMLSSL-025|WMLSSL-025]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-LANG-FUNCTION-IDENTIFIERS|WMLSCRIPT-LIBRARIES-FX-LANG-FUNCTION-IDENTIFIERS]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-018",
    "WMLSSL-025"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "appendix-a",
    "heading": "Appendix A. Library Summary",
    "normalizedTextSha256": "218c9f4b348c0a1b15edf3f6d8ee74e2c1f899160cf6525c8e2adeeb3b48a215"
  },
  "normativeForce": "table",
  "obligationLevel": "required",
  "obligationSynopsis": "Map lang function identifiers exactly as follows: abs=0, min=1, max=2, parseInt=3, parseFloat=4, isInt=5, isFloat=6, maxInt=7, minInt=8, float=9, exit=10, abort=11, random=12, seed=13, characterSet=14.",
  "workItems": [
    "W1-05",
    "WMLS-501",
    "WMLS-504"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-013"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
