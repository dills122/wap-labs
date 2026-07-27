---
id: "scr-row:WMLSSL-016"
key: "WMLSSL-016"
type: "scr-row"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# Supports error handling

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wmlscript-libraries|wmlscript-libraries]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `refines` ← [[clauses/WMLSCRIPT-LIBRARIES-CL-FUNCTION-SPECIFIC-ERROR-RESULT|WMLSCRIPT-LIBRARIES-CL-FUNCTION-SPECIFIC-ERROR-RESULT]]
- `refines` ← [[clauses/WMLSCRIPT-LIBRARIES-CL-INVALID-ARGUMENT-RESULT|WMLSCRIPT-LIBRARIES-CL-INVALID-ARGUMENT-RESULT]]
- `refines` ← [[clauses/WMLSCRIPT-LIBRARIES-CL-UNCONVERTIBLE-ARGUMENT-RESULT|WMLSCRIPT-LIBRARIES-CL-UNCONVERTIBLE-ARGUMENT-RESULT]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "referencedSection": "Supports error handling",
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "staticConformanceSection": "12.5"
  },
  "implementationStatus": "partial",
  "ownerLayers": [
    "engine-wasm"
  ],
  "workItems": [
    "WMLS-504",
    "W1-05"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
