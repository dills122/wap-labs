---
id: "clause:WMLSCRIPT-LIBRARIES-CL-WMLBROWSER-SET-VAR-BEHAVIOR"
key: "WMLSCRIPT-LIBRARIES-CL-WMLBROWSER-SET-VAR-BEHAVIOR"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Set the current-context variable and return true on success or false when the legal assignment cannot be completed.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-017|RQ-WMLS-017]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `planned-by` → [[work-items/WMLS-505|WMLS-505]]
- `refines` → [[scr-rows/WMLSSL-086|WMLSSL-086]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-WMLBROWSER-SET-VAR-BEHAVIOR|WMLSCRIPT-LIBRARIES-FX-WMLBROWSER-SET-VAR-BEHAVIOR]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-086"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "11.2",
    "heading": "11.2 setVar",
    "normalizedTextSha256": "6d6e4150ed0ffb6058eded4d4c868aa480111e888255a4544cfd07120d390ab0"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Set the current-context variable and return true on success or false when the legal assignment cannot be completed.",
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
    "RQ-WMLS-017"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
