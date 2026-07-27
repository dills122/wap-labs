---
id: "clause:WMLSCRIPT-LIBRARIES-CL-WMLBROWSER-GO-LAST-REQUEST-WINS"
key: "WMLSCRIPT-LIBRARIES-CL-WMLBROWSER-GO-LAST-REQUEST-WINS"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Let the final go or prev call replace every earlier pending navigation request.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-018|RQ-WMLS-018]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `planned-by` → [[work-items/WMLS-505|WMLS-505]]
- `refines` → [[scr-rows/WMLSSL-087|WMLSSL-087]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-WMLBROWSER-GO-LAST-REQUEST-WINS|WMLSCRIPT-LIBRARIES-FX-WMLBROWSER-GO-LAST-REQUEST-WINS]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-087"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "11.3",
    "heading": "11.3 go",
    "normalizedTextSha256": "22b22cc7abfc93ab6c273a7f514a2cce8fbd02c4b8b79e5b4bcdbd9cd1fe4ff9"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Let the final go or prev call replace every earlier pending navigation request.",
  "workItems": [
    "W0-07",
    "W1-05",
    "WMLS-504",
    "WMLS-505"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-018"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
