---
id: "clause:WMLSCRIPT-CL-INTERPRETER-EXECUTION-STATE"
key: "WMLSCRIPT-CL-INTERPRETER-EXECUTION-STATE"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Maintain an instruction pointer, function variables, operand stack, and function-call stack while executing a WMLScript function.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-008|RQ-WMLS-008]]
- `planned-by` → [[work-items/WMLS-501|WMLS-501]]
- `refines` → [[scr-rows/WMLS-C-069|WMLS-C-069]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-INTERPRETER-EXECUTION-STATE|WMLSCRIPT-FX-INTERPRETER-EXECUTION-STATE]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-069"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "8.1",
    "heading": "8.1 Interpreter Architecture",
    "normalizedTextSha256": "d3d91e5d06d7d2d3fa5da9d04b03baa497c6d4039829120f3bab418d8e08c126"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Maintain an instruction pointer, function variables, operand stack, and function-call stack while executing a WMLScript function.",
  "workItems": [
    "W1-05",
    "WMLS-501"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-008"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
