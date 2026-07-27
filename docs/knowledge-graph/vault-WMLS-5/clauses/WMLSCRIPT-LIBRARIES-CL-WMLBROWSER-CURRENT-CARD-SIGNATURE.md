---
id: "clause:WMLSCRIPT-LIBRARIES-CL-WMLBROWSER-CURRENT-CARD-SIGNATURE"
key: "WMLSCRIPT-LIBRARIES-CL-WMLBROWSER-CURRENT-CARD-SIGNATURE"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Implement zero-argument WMLBrowser.getCurrentCard(), returning String or invalid.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-020|RQ-WMLS-020]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `planned-by` → [[work-items/WMLS-505|WMLS-505]]
- `refines` → [[scr-rows/WMLSSL-090|WMLSSL-090]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-WMLBROWSER-CURRENT-CARD-SIGNATURE|WMLSCRIPT-LIBRARIES-FX-WMLBROWSER-CURRENT-CARD-SIGNATURE]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-090"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "11.6",
    "heading": "11.6 getCurrentCard",
    "normalizedTextSha256": "6dba34b5c91d9fcaef0cb048cc02b31daf9c23a1b1f6c8d989833ed773cd709d"
  },
  "normativeForce": "table",
  "obligationLevel": "required",
  "obligationSynopsis": "Implement zero-argument WMLBrowser.getCurrentCard(), returning String or invalid.",
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
    "RQ-WMLS-020"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
