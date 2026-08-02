---
id: "clause:WMLSCRIPT-CL-LOGICAL-BOOLEAN-CONVERSION"
key: "WMLSCRIPT-CL-LOGICAL-BOOLEAN-CONVERSION"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Apply the Boolean conversion category to logical instruction operands and return invalid when conversion is illegal.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-006|RQ-WMLS-006]]
- `maps-to` → [[requirements/RQ-WMLS-007|RQ-WMLS-007]]
- `maps-to` → [[requirements/RQ-WMLS-008|RQ-WMLS-008]]
- `planned-by` → [[work-items/WMLS-501|WMLS-501]]
- `planned-by` → [[work-items/WMLS-502|WMLS-502]]
- `refines` → [[scr-rows/WMLS-C-077|WMLS-C-077]]
- `refines` → [[scr-rows/WMLS-C-102|WMLS-C-102]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-LOGICAL-BOOLEAN-CONVERSION|WMLSCRIPT-FX-LOGICAL-BOOLEAN-CONVERSION]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-077",
    "WMLS-C-102"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "10.5.8",
    "heading": "10.5.8 Logical Instructions",
    "normalizedTextSha256": "323305c210bce45e9f3099e56965e4d590e76f8523cba17d6920fd42badc41f6"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Apply the Boolean conversion category to logical instruction operands and return invalid when conversion is illegal.",
  "workItems": [
    "W1-02",
    "W1-04",
    "W1-05",
    "WMLS-501",
    "WMLS-502"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-006",
    "RQ-WMLS-007",
    "RQ-WMLS-008"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
