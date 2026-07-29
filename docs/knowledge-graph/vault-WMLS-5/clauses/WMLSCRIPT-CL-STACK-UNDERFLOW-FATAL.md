---
id: "clause:WMLSCRIPT-CL-STACK-UNDERFLOW-FATAL"
key: "WMLSCRIPT-CL-STACK-UNDERFLOW-FATAL"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Treat an instruction that pops an empty operand stack as the specified fatal bytecode error.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-008|RQ-WMLS-008]]
- `maps-to` → [[requirements/RQ-WMLS-010|RQ-WMLS-010]]
- `planned-by` → [[work-items/WMLS-501|WMLS-501]]
- `planned-by` → [[work-items/WMLS-502|WMLS-502]]
- `planned-by` → [[work-items/WMLS-505|WMLS-505]]
- `refines` → [[scr-rows/WMLS-C-103|WMLS-C-103]]
- `refines` → [[scr-rows/WMLS-C-110|WMLS-C-110]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-STACK-UNDERFLOW-FATAL|WMLSCRIPT-FX-STACK-UNDERFLOW-FATAL]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-103",
    "WMLS-C-110"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "10.5.9",
    "heading": "10.5.9 Stack Instructions",
    "normalizedTextSha256": "7bd58c6898bfbcc504a79b980b8d893654ea9102343d34c2aa2af36ed3f98e20"
  },
  "normativeForce": "error-condition",
  "obligationLevel": "required",
  "obligationSynopsis": "Treat an instruction that pops an empty operand stack as the specified fatal bytecode error.",
  "workItems": [
    "W1-02",
    "W1-04",
    "W1-05",
    "W1-06",
    "W1-07",
    "WMLS-501",
    "WMLS-502",
    "WMLS-505"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-008",
    "RQ-WMLS-010"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
