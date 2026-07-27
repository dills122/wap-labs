---
id: "clause:WMLSCRIPT-LIBRARIES-CL-WMLBROWSER-REFRESH-RESULT"
key: "WMLSCRIPT-LIBRARIES-CL-WMLBROWSER-REFRESH-RESULT"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Return empty string on success, a non-empty implementation-dependent diagnostic on failure, or invalid when immediate refresh is unsupported.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-021|RQ-WMLS-021]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `refines` → [[scr-rows/WMLSSL-091|WMLSSL-091]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-WMLBROWSER-REFRESH-RESULT|WMLSCRIPT-LIBRARIES-FX-WMLBROWSER-REFRESH-RESULT]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-091"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "11.7",
    "heading": "11.7 refresh",
    "normalizedTextSha256": "663dfe6e082924e79034d55521a5031c1ea607b83cf4e06913059add3e350122"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Return empty string on success, a non-empty implementation-dependent diagnostic on failure, or invalid when immediate refresh is unsupported.",
  "workItems": [
    "W1-05",
    "WMLS-504"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-021"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
