---
id: "clause:WMLSCRIPT-CL-COMPARISON-INSTRUCTION-MATRIX"
key: "WMLSCRIPT-CL-COMPARISON-INSTRUCTION-MATRIX"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Implement every equality and ordering opcode with its multi-type conversion rules, boolean result, and stack effect.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-008|RQ-WMLS-008]]
- `planned-by` → [[work-items/WMLS-501|WMLS-501]]
- `planned-by` → [[work-items/WMLS-502|WMLS-502]]
- `refines` → [[scr-rows/WMLS-C-069|WMLS-C-069]]
- `refines` → [[scr-rows/WMLS-C-101|WMLS-C-101]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-COMPARISON-INSTRUCTION-MATRIX|WMLSCRIPT-FX-COMPARISON-INSTRUCTION-MATRIX]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-069",
    "WMLS-C-101"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "10.5.7",
    "heading": "10.5.7 Comparison Instructions",
    "normalizedTextSha256": "6f645854d150acd0cda63ee94996f64139367efb51c77d53bd57336a7b868c8e"
  },
  "normativeForce": "table",
  "obligationLevel": "required",
  "obligationSynopsis": "Implement every equality and ordering opcode with its multi-type conversion rules, boolean result, and stack effect.",
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
    "RQ-WMLS-008"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
