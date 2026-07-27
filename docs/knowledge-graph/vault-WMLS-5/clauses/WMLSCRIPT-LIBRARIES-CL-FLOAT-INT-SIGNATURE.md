---
id: "clause:WMLSCRIPT-LIBRARIES-CL-FLOAT-INT-SIGNATURE"
key: "WMLSCRIPT-LIBRARIES-CL-FLOAT-INT-SIGNATURE"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Implement Float.int(value) for a Number argument, returning Integer or invalid.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-007|RQ-WMLS-007]]
- `maps-to` → [[requirements/RQ-WMLS-014|RQ-WMLS-014]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `refines` → [[scr-rows/WMLSSL-047|WMLSSL-047]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-FLOAT-INT-SIGNATURE|WMLSCRIPT-LIBRARIES-FX-FLOAT-INT-SIGNATURE]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-047"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "8.1",
    "heading": "8.1   int",
    "normalizedTextSha256": "4860df55d13cdd1565b1938d671f2fd5668b9bb1ef29bd89e21072bb2ebd340a"
  },
  "normativeForce": "table",
  "obligationLevel": "required",
  "obligationSynopsis": "Implement Float.int(value) for a Number argument, returning Integer or invalid.",
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
