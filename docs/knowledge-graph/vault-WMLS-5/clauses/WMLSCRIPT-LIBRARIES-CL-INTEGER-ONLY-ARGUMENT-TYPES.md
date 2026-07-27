---
id: "clause:WMLSCRIPT-LIBRARIES-CL-INTEGER-ONLY-ARGUMENT-TYPES"
key: "WMLSCRIPT-LIBRARIES-CL-INTEGER-ONLY-ARGUMENT-TYPES"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# On an integer-only device, accept only Boolean, Integer, String, and Invalid library arguments and ignore floating-point conversion rules.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-012|RQ-WMLS-012]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `refines` → [[scr-rows/WMLSSL-014|WMLSSL-014]]
- `refines` → [[scr-rows/WMLSSL-015|WMLSSL-015]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-INTEGER-ONLY-ARGUMENT-TYPES|WMLSCRIPT-LIBRARIES-FX-INTEGER-ONLY-ARGUMENT-TYPES]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-014",
    "WMLSSL-015"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "6.4",
    "heading": "6.4   Support for Integer-Only Devices",
    "normalizedTextSha256": "d4c4b3e3f11c7cc8c7f537dc86a28645009b756417c230820390eace49cf3733"
  },
  "normativeForce": "table",
  "obligationLevel": "required",
  "obligationSynopsis": "On an integer-only device, accept only Boolean, Integer, String, and Invalid library arguments and ignore floating-point conversion rules.",
  "workItems": [
    "W1-05",
    "WMLS-504"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-012"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
