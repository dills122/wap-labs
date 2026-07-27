---
id: "clause:WMLSCRIPT-CL-OPERATOR-CONVERSION-ATOMICITY"
key: "WMLSCRIPT-CL-OPERATOR-CONVERSION-ATOMICITY"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Perform an operation only when every required operand conversion is legal; otherwise continue its ordered rules or return invalid.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-006|RQ-WMLS-006]]
- `maps-to` → [[requirements/RQ-WMLS-007|RQ-WMLS-007]]
- `planned-by` → [[work-items/WMLS-502|WMLS-502]]
- `refines` → [[scr-rows/WMLS-C-077|WMLS-C-077]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-OPERATOR-CONVERSION-ATOMICITY|WMLSCRIPT-FX-OPERATOR-CONVERSION-ATOMICITY]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-077"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "6.9",
    "heading": "6.9 Operator Data Type Conversion Rules",
    "normalizedTextSha256": "7e88d36f96f7689554a6134c088541fc5db982c8c804377fdb8a6cf2e89e29d7"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Perform an operation only when every required operand conversion is legal; otherwise continue its ordered rules or return invalid.",
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
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
