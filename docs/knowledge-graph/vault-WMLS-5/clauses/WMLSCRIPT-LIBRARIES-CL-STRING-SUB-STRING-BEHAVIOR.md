---
id: "clause:WMLSCRIPT-LIBRARIES-CL-STRING-SUB-STRING-BEHAVIOR"
key: "WMLSCRIPT-LIBRARIES-CL-STRING-SUB-STRING-BEHAVIOR"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Convert Float indexes through Float.int, clamp a negative start to zero, and clamp length to the available suffix.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-015|RQ-WMLS-015]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `refines` → [[scr-rows/WMLSSL-058|WMLSSL-058]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-STRING-SUB-STRING-BEHAVIOR|WMLSCRIPT-LIBRARIES-FX-STRING-SUB-STRING-BEHAVIOR]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-058"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "9.4",
    "heading": "9.4   subString",
    "normalizedTextSha256": "aed0e2032010c47a10547c6b8e321e6d09b40faf28c824c419d9234ab21703b5"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Convert Float indexes through Float.int, clamp a negative start to zero, and clamp length to the available suffix.",
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
