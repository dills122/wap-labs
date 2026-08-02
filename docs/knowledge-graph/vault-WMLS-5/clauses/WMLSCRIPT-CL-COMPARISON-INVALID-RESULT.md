---
id: "clause:WMLSCRIPT-CL-COMPARISON-INVALID-RESULT"
key: "WMLSCRIPT-CL-COMPARISON-INVALID-RESULT"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Return invalid rather than true or false when a comparison operand conversion or value is invalid.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-006|RQ-WMLS-006]]
- `maps-to` → [[requirements/RQ-WMLS-007|RQ-WMLS-007]]
- `maps-to` → [[requirements/RQ-WMLS-008|RQ-WMLS-008]]
- `planned-by` → [[work-items/WMLS-501|WMLS-501]]
- `planned-by` → [[work-items/WMLS-502|WMLS-502]]
- `refines` → [[scr-rows/WMLS-C-077|WMLS-C-077]]
- `refines` → [[scr-rows/WMLS-C-101|WMLS-C-101]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-COMPARISON-INVALID-RESULT|WMLSCRIPT-FX-COMPARISON-INVALID-RESULT]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-077",
    "WMLS-C-101"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "10.5.7",
    "heading": "10.5.7 Comparison Instructions",
    "normalizedTextSha256": "6f645854d150acd0cda63ee94996f64139367efb51c77d53bd57336a7b868c8e"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Return invalid rather than true or false when a comparison operand conversion or value is invalid.",
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
