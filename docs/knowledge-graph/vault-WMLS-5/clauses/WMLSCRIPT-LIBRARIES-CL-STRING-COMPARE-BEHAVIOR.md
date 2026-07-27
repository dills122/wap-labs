---
id: "clause:WMLSCRIPT-LIBRARIES-CL-STRING-COMPARE-BEHAVIOR"
key: "WMLSCRIPT-LIBRARIES-CL-STRING-COMPARE-BEHAVIOR"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Compare native character codes lexicographically and return -1, 0, or 1 for less-than, identical, or greater-than.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-015|RQ-WMLS-015]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `refines` → [[scr-rows/WMLSSL-068|WMLSSL-068]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-STRING-COMPARE-BEHAVIOR|WMLSCRIPT-LIBRARIES-FX-STRING-COMPARE-BEHAVIOR]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-068"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "9.14",
    "heading": "9.14 compare",
    "normalizedTextSha256": "85aacc04b34b8394915917a774a32c4df1d447457008487d951d275a87915b2c"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Compare native character codes lexicographically and return -1, 0, or 1 for less-than, identical, or greater-than.",
  "workItems": [
    "W1-05",
    "WMLS-504"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-015"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
