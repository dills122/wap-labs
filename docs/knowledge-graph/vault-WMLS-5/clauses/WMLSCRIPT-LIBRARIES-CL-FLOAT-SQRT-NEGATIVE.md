---
id: "clause:WMLSCRIPT-LIBRARIES-CL-FLOAT-SQRT-NEGATIVE"
key: "WMLSCRIPT-LIBRARIES-CL-FLOAT-SQRT-NEGATIVE"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Return invalid for a negative argument.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-007|RQ-WMLS-007]]
- `maps-to` → [[requirements/RQ-WMLS-014|RQ-WMLS-014]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `refines` → [[scr-rows/WMLSSL-052|WMLSSL-052]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-FLOAT-SQRT-NEGATIVE|WMLSCRIPT-LIBRARIES-FX-FLOAT-SQRT-NEGATIVE]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-052"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "8.6",
    "heading": "8.6   sqrt",
    "normalizedTextSha256": "fda0a26659f98ef310e7b10e73df5d20839e1b04dd30e00e09ede82afe99cb8f"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Return invalid for a negative argument.",
  "workItems": [
    "W1-05",
    "WMLS-504"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-007",
    "RQ-WMLS-014"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
