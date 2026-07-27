---
id: "clause:WMLSCRIPT-LIBRARIES-CL-LANG-FLOAT-BEHAVIOR"
key: "WMLSCRIPT-LIBRARIES-CL-LANG-FLOAT-BEHAVIOR"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Return true when floating-point operations are supported and false on an integer-only device.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-013|RQ-WMLS-013]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `refines` → [[scr-rows/WMLSSL-040|WMLSSL-040]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-LANG-FLOAT-BEHAVIOR|WMLSCRIPT-LIBRARIES-FX-LANG-FLOAT-BEHAVIOR]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-040"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "7.10",
    "heading": "7.10 float",
    "normalizedTextSha256": "e4bbd3424650545863d257a0a5cfa215ccc1ec2e83074f2fe10f4b508f7b1fa3"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Return true when floating-point operations are supported and false on an integer-only device.",
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
