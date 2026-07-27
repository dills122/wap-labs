---
id: "clause:WMLSCRIPT-LIBRARIES-CL-STRING-CHAR-AT-SIGNATURE"
key: "WMLSCRIPT-LIBRARIES-CL-STRING-CHAR-AT-SIGNATURE"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Implement String.charAt(string, index) for String and Number arguments, returning String or invalid.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-015|RQ-WMLS-015]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `refines` → [[scr-rows/WMLSSL-057|WMLSSL-057]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-STRING-CHAR-AT-SIGNATURE|WMLSCRIPT-LIBRARIES-FX-STRING-CHAR-AT-SIGNATURE]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-057"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "9.3",
    "heading": "9.3   charAt",
    "normalizedTextSha256": "ca1cc9d87753ae3691f80a41c4d6e2ba14099aba74908abb86c8c2ba555dd7e3"
  },
  "normativeForce": "table",
  "obligationLevel": "required",
  "obligationSynopsis": "Implement String.charAt(string, index) for String and Number arguments, returning String or invalid.",
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
