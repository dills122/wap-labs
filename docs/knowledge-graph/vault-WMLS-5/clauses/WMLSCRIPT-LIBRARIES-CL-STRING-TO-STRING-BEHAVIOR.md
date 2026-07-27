---
id: "clause:WMLSCRIPT-LIBRARIES-CL-STRING-TO-STRING-BEHAVIOR"
key: "WMLSCRIPT-LIBRARIES-CL-STRING-TO-STRING-BEHAVIOR"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Apply WMLScript Boolean, Integer, Float, and String conversions, but convert Invalid to the literal string invalid.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-015|RQ-WMLS-015]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `refines` → [[scr-rows/WMLSSL-069|WMLSSL-069]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-STRING-TO-STRING-BEHAVIOR|WMLSCRIPT-LIBRARIES-FX-STRING-TO-STRING-BEHAVIOR]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-069"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "9.15",
    "heading": "9.15 toString",
    "normalizedTextSha256": "3d8c4c28019c9997bf0019d59312e43df6d9da2196cc941d647c240862d0954a"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Apply WMLScript Boolean, Integer, Float, and String conversions, but convert Invalid to the literal string invalid.",
  "workItems": [
    "W1-05",
    "WMLS-504"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-015"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
