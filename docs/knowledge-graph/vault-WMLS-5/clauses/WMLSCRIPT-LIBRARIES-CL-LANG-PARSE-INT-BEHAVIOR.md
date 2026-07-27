---
id: "clause:WMLSCRIPT-LIBRARIES-CL-LANG-PARSE-INT-BEHAVIOR"
key: "WMLSCRIPT-LIBRARIES-CL-LANG-PARSE-INT-BEHAVIOR"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Parse a leading signed decimal integer and stop before the first character that is neither the leading sign nor a decimal digit.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-013|RQ-WMLS-013]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `refines` → [[scr-rows/WMLSSL-034|WMLSSL-034]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-LANG-PARSE-INT-BEHAVIOR|WMLSCRIPT-LIBRARIES-FX-LANG-PARSE-INT-BEHAVIOR]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-034"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "7.4",
    "heading": "7.4   parseInt",
    "normalizedTextSha256": "9d5a07ca211b4cdb67757c278e166d3a8808729ce358d50ee9ccd2871491baf8"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Parse a leading signed decimal integer and stop before the first character that is neither the leading sign nor a decimal digit.",
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
