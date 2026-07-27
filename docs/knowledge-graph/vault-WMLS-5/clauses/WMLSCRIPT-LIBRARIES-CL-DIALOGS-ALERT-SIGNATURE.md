---
id: "clause:WMLSCRIPT-LIBRARIES-CL-DIALOGS-ALERT-SIGNATURE"
key: "WMLSCRIPT-LIBRARIES-CL-DIALOGS-ALERT-SIGNATURE"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Implement Dialogs.alert(message) for a String argument, returning String or invalid.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-022|RQ-WMLS-022]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `planned-by` → [[work-items/WMLS-505|WMLS-505]]
- `refines` → [[scr-rows/WMLSSL-094|WMLSSL-094]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-DIALOGS-ALERT-SIGNATURE|WMLSCRIPT-LIBRARIES-FX-DIALOGS-ALERT-SIGNATURE]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-094"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "12.3",
    "heading": "12.3 alert",
    "normalizedTextSha256": "0ecfd112a6a2f513df326845916a51714d8f6b64652704bd4ede04d1340a4e26"
  },
  "normativeForce": "table",
  "obligationLevel": "required",
  "obligationSynopsis": "Implement Dialogs.alert(message) for a String argument, returning String or invalid.",
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
