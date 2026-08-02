---
id: "clause:WMLSCRIPT-CL-CONVERSION-BOOLEAN-MATRIX"
key: "WMLSCRIPT-CL-CONVERSION-BOOLEAN-MATRIX"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Convert empty string, integer zero, and floating zero to false; convert other string and numeric values to true; reject invalid.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-006|RQ-WMLS-006]]
- `maps-to` → [[requirements/RQ-WMLS-007|RQ-WMLS-007]]
- `planned-by` → [[work-items/WMLS-502|WMLS-502]]
- `refines` → [[scr-rows/WMLS-C-075|WMLS-C-075]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-CONVERSION-BOOLEAN-MATRIX|WMLSCRIPT-FX-CONVERSION-BOOLEAN-MATRIX]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-075"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "6.8.5",
    "heading": "6.8.5 Conversions to Boolean",
    "normalizedTextSha256": "6ade2686a15733b7f036f466c1a8835e32b1e16563d481d549b4a1304fac3f57"
  },
  "normativeForce": "table",
  "obligationLevel": "required",
  "obligationSynopsis": "Convert empty string, integer zero, and floating zero to false; convert other string and numeric values to true; reject invalid.",
  "workItems": [
    "W1-04",
    "WMLS-502"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-006",
    "RQ-WMLS-007"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
