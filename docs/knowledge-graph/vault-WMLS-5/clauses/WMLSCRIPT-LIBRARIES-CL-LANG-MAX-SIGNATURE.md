---
id: "clause:WMLSCRIPT-LIBRARIES-CL-LANG-MAX-SIGNATURE"
key: "WMLSCRIPT-LIBRARIES-CL-LANG-MAX-SIGNATURE"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Implement Lang.max(value1, value2) for two Number arguments, returning Number or invalid.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-013|RQ-WMLS-013]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `refines` → [[scr-rows/WMLSSL-033|WMLSSL-033]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-LANG-MAX-SIGNATURE|WMLSCRIPT-LIBRARIES-FX-LANG-MAX-SIGNATURE]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-033"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "7.3",
    "heading": "7.3   max",
    "normalizedTextSha256": "1b0d865c177cfd5a9ed54a95fb435b7267eec408def0503a21325f32a6c835cd"
  },
  "normativeForce": "table",
  "obligationLevel": "required",
  "obligationSynopsis": "Implement Lang.max(value1, value2) for two Number arguments, returning Number or invalid.",
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
