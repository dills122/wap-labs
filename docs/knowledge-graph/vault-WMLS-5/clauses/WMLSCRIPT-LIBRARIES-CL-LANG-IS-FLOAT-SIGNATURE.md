---
id: "clause:WMLSCRIPT-LIBRARIES-CL-LANG-IS-FLOAT-SIGNATURE"
key: "WMLSCRIPT-LIBRARIES-CL-LANG-IS-FLOAT-SIGNATURE"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Implement Lang.isFloat(value) for an Any argument, returning Boolean or invalid.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-013|RQ-WMLS-013]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `refines` → [[scr-rows/WMLSSL-037|WMLSSL-037]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-LANG-IS-FLOAT-SIGNATURE|WMLSCRIPT-LIBRARIES-FX-LANG-IS-FLOAT-SIGNATURE]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-037"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "7.7",
    "heading": "7.7   isFloat",
    "normalizedTextSha256": "5b10ba4b24bbca94363701db3b728648198ec1794e452d25e694de731dad0024"
  },
  "normativeForce": "table",
  "obligationLevel": "required",
  "obligationSynopsis": "Implement Lang.isFloat(value) for an Any argument, returning Boolean or invalid.",
  "workItems": [
    "W1-05",
    "WMLS-504"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-013"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
