---
id: "clause:WMLSCRIPT-LIBRARIES-CL-LANG-LIBRARY-IDENTIFIER"
key: "WMLSCRIPT-LIBRARIES-CL-LANG-LIBRARY-IDENTIFIER"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Map the lang standard library to encoded library identifier 0.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-013|RQ-WMLS-013]]
- `maps-to` → [[requirements/RQ-WMLS-017|RQ-WMLS-017]]
- `planned-by` → [[work-items/WMLS-501|WMLS-501]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `refines` → [[scr-rows/WMLSSL-018|WMLSSL-018]]
- `refines` → [[scr-rows/WMLSSL-024|WMLSSL-024]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-LANG-LIBRARY-IDENTIFIER|WMLSCRIPT-LIBRARIES-FX-LANG-LIBRARY-IDENTIFIER]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-018",
    "WMLSSL-024"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "appendix-a",
    "heading": "Appendix A. Library Summary",
    "normalizedTextSha256": "218c9f4b348c0a1b15edf3f6d8ee74e2c1f899160cf6525c8e2adeeb3b48a215"
  },
  "normativeForce": "table",
  "obligationLevel": "required",
  "obligationSynopsis": "Map the lang standard library to encoded library identifier 0.",
  "workItems": [
    "W1-05",
    "WMLS-501",
    "WMLS-504"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-013",
    "RQ-WMLS-017"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
