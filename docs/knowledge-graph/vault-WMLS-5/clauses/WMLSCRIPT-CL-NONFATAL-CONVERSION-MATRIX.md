---
id: "clause:WMLSCRIPT-CL-NONFATAL-CONVERSION-MATRIX"
key: "WMLSCRIPT-CL-NONFATAL-CONVERSION-MATRIX"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Return invalid when conversion exceeds integer or floating range, and floating zero when conversion underflows.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-006|RQ-WMLS-006]]
- `maps-to` → [[requirements/RQ-WMLS-007|RQ-WMLS-007]]
- `maps-to` → [[requirements/RQ-WMLS-010|RQ-WMLS-010]]
- `planned-by` → [[work-items/WMLS-502|WMLS-502]]
- `planned-by` → [[work-items/WMLS-505|WMLS-505]]
- `refines` → [[scr-rows/WMLS-C-073|WMLS-C-073]]
- `refines` → [[scr-rows/WMLS-C-077|WMLS-C-077]]
- `refines` → [[scr-rows/WMLS-C-111|WMLS-C-111]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-NONFATAL-CONVERSION-MATRIX|WMLSCRIPT-FX-NONFATAL-CONVERSION-MATRIX]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-073",
    "WMLS-C-077",
    "WMLS-C-111"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "12.4",
    "heading": "12.4 Non-Fatal Errors",
    "normalizedTextSha256": "91c80ba6293c0f073dc4717b24d520e2e590edb6f117f6b09a60572d6f33a49c"
  },
  "normativeForce": "table",
  "obligationLevel": "required",
  "obligationSynopsis": "Return invalid when conversion exceeds integer or floating range, and floating zero when conversion underflows.",
  "workItems": [
    "W1-04",
    "W1-06",
    "W1-07",
    "WMLS-502",
    "WMLS-505"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-006",
    "RQ-WMLS-007",
    "RQ-WMLS-010"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
