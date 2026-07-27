---
id: "clause:WMLSCRIPT-CL-LOGICAL-INSTRUCTION-MATRIX"
key: "WMLSCRIPT-CL-LOGICAL-INSTRUCTION-MATRIX"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Implement logical not and short-circuit-related opcode semantics with boolean conversion, specified stack effects, and invalid propagation.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-008|RQ-WMLS-008]]
- `planned-by` → [[work-items/WMLS-501|WMLS-501]]
- `refines` → [[scr-rows/WMLS-C-069|WMLS-C-069]]
- `refines` → [[scr-rows/WMLS-C-102|WMLS-C-102]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-LOGICAL-INSTRUCTION-MATRIX|WMLSCRIPT-FX-LOGICAL-INSTRUCTION-MATRIX]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-069",
    "WMLS-C-102"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "10.5.8",
    "heading": "10.5.8 Logical Instructions",
    "normalizedTextSha256": "323305c210bce45e9f3099e56965e4d590e76f8523cba17d6920fd42badc41f6"
  },
  "normativeForce": "table",
  "obligationLevel": "required",
  "obligationSynopsis": "Implement logical not and short-circuit-related opcode semantics with boolean conversion, specified stack effects, and invalid propagation.",
  "workItems": [
    "W1-02",
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
