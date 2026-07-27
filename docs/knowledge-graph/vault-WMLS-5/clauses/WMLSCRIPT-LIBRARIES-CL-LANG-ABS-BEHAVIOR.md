---
id: "clause:WMLSCRIPT-LIBRARIES-CL-LANG-ABS-BEHAVIOR"
key: "WMLSCRIPT-LIBRARIES-CL-LANG-ABS-BEHAVIOR"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Return the absolute magnitude while preserving whether the input was Integer or Float.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-013|RQ-WMLS-013]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `refines` → [[scr-rows/WMLSSL-031|WMLSSL-031]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-LANG-ABS-BEHAVIOR|WMLSCRIPT-LIBRARIES-FX-LANG-ABS-BEHAVIOR]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-031"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "7.1",
    "heading": "7.1     abs",
    "normalizedTextSha256": "6f97be27c949c231495ea7c7b59d351f11345a3bfa7aeb729d8676cddb76798d"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Return the absolute magnitude while preserving whether the input was Integer or Float.",
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
