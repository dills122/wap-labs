---
id: "clause:WMLSCRIPT-CL-OPERATOR-CONVERSION-ORDER"
key: "WMLSCRIPT-CL-OPERATOR-CONVERSION-ORDER"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Apply each operator conversion step in specification order until an operation and operand types are selected or invalid is returned.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-006|RQ-WMLS-006]]
- `maps-to` → [[requirements/RQ-WMLS-007|RQ-WMLS-007]]
- `planned-by` → [[work-items/WMLS-502|WMLS-502]]
- `refines` → [[scr-rows/WMLS-C-077|WMLS-C-077]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-OPERATOR-CONVERSION-ORDER|WMLSCRIPT-FX-OPERATOR-CONVERSION-ORDER]]

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
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Apply each operator conversion step in specification order until an operation and operand types are selected or invalid is returned.",
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
