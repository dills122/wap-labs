---
id: "clause:WMLSCRIPT-LIBRARIES-CL-FLOAT-CEIL-SIGNATURE"
key: "WMLSCRIPT-LIBRARIES-CL-FLOAT-CEIL-SIGNATURE"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Implement Float.ceil(value) for a Number argument, returning Integer or invalid.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-007|RQ-WMLS-007]]
- `maps-to` → [[requirements/RQ-WMLS-014|RQ-WMLS-014]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `refines` → [[scr-rows/WMLSSL-049|WMLSSL-049]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-FLOAT-CEIL-SIGNATURE|WMLSCRIPT-LIBRARIES-FX-FLOAT-CEIL-SIGNATURE]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-049"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "8.3",
    "heading": "8.3   ceil",
    "normalizedTextSha256": "f8c1dcbf8e907e423b9d39901de3f91d3da54a12b0af18a859971cd51a39b840"
  },
  "normativeForce": "table",
  "obligationLevel": "required",
  "obligationSynopsis": "Implement Float.ceil(value) for a Number argument, returning Integer or invalid.",
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
