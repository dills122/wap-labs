---
id: "clause:WMLSCRIPT-LIBRARIES-CL-LANG-PARSE-FLOAT-BEHAVIOR"
key: "WMLSCRIPT-LIBRARIES-CL-LANG-PARSE-FLOAT-BEHAVIOR"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Parse a legal leading decimal floating-point representation and stop at the first character that cannot continue it.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-013|RQ-WMLS-013]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `refines` → [[scr-rows/WMLSSL-035|WMLSSL-035]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-LANG-PARSE-FLOAT-BEHAVIOR|WMLSCRIPT-LIBRARIES-FX-LANG-PARSE-FLOAT-BEHAVIOR]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-035"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "7.5",
    "heading": "7.5   parseFloat",
    "normalizedTextSha256": "21fc16bb13f45dddbceda54094df7dfc650d431354cf3d409b68c5f8c2114883"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Parse a legal leading decimal floating-point representation and stop at the first character that cannot continue it.",
  "workItems": [
    "W1-05",
    "WMLS-504"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-013"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
