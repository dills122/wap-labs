---
id: "clause:WMLSCRIPT-CL-CONSTANT-INSTRUCTION-MATRIX"
key: "WMLSCRIPT-CL-CONSTANT-INSTRUCTION-MATRIX"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Implement indexed constant loads and immediate zero, one, minus-one, empty-string, invalid, true, and false instructions with exact stack effects.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-008|RQ-WMLS-008]]
- `planned-by` → [[work-items/WMLS-501|WMLS-501]]
- `planned-by` → [[work-items/WMLS-502|WMLS-502]]
- `refines` → [[scr-rows/WMLS-C-069|WMLS-C-069]]
- `refines` → [[scr-rows/WMLS-C-098|WMLS-C-098]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-CONSTANT-INSTRUCTION-MATRIX|WMLSCRIPT-FX-CONSTANT-INSTRUCTION-MATRIX]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-069",
    "WMLS-C-098"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "10.5.4",
    "heading": "10.5.4 Access To Constants",
    "normalizedTextSha256": "3de204f82ed82cffd4dcae2535cb06a4cd4fcdd04f1dc79ee4cf93deefa4c9b6"
  },
  "normativeForce": "table",
  "obligationLevel": "required",
  "obligationSynopsis": "Implement indexed constant loads and immediate zero, one, minus-one, empty-string, invalid, true, and false instructions with exact stack effects.",
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
