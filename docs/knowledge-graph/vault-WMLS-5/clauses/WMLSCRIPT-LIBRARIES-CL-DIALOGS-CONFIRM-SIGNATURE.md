---
id: "clause:WMLSCRIPT-LIBRARIES-CL-DIALOGS-CONFIRM-SIGNATURE"
key: "WMLSCRIPT-LIBRARIES-CL-DIALOGS-CONFIRM-SIGNATURE"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Implement Dialogs.confirm(message, ok, cancel) for three String arguments, returning Boolean or invalid.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-022|RQ-WMLS-022]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `planned-by` → [[work-items/WMLS-505|WMLS-505]]
- `refines` → [[scr-rows/WMLSSL-093|WMLSSL-093]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-DIALOGS-CONFIRM-SIGNATURE|WMLSCRIPT-LIBRARIES-FX-DIALOGS-CONFIRM-SIGNATURE]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-093"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "12.2",
    "heading": "12.2 confirm",
    "normalizedTextSha256": "3a6599b45518bf543da67c7ee652d92cc361425c1595a981e9993cf62d1e00a1"
  },
  "normativeForce": "table",
  "obligationLevel": "required",
  "obligationSynopsis": "Implement Dialogs.confirm(message, ok, cancel) for three String arguments, returning Boolean or invalid.",
  "workItems": [
    "W0-05",
    "W1-05",
    "WMLS-504",
    "WMLS-505"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-022"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
