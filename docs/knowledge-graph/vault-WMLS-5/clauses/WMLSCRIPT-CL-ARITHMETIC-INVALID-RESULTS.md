---
id: "clause:WMLSCRIPT-CL-ARITHMETIC-INVALID-RESULTS"
key: "WMLSCRIPT-CL-ARITHMETIC-INVALID-RESULTS"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Return invalid for arithmetic conversion failure, division by zero, remainder by zero, or integer overflow without aborting the invocation.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-006|RQ-WMLS-006]]
- `maps-to` → [[requirements/RQ-WMLS-007|RQ-WMLS-007]]
- `maps-to` → [[requirements/RQ-WMLS-008|RQ-WMLS-008]]
- `maps-to` → [[requirements/RQ-WMLS-010|RQ-WMLS-010]]
- `planned-by` → [[work-items/WMLS-501|WMLS-501]]
- `planned-by` → [[work-items/WMLS-502|WMLS-502]]
- `planned-by` → [[work-items/WMLS-505|WMLS-505]]
- `refines` → [[scr-rows/WMLS-C-077|WMLS-C-077]]
- `refines` → [[scr-rows/WMLS-C-099|WMLS-C-099]]
- `refines` → [[scr-rows/WMLS-C-111|WMLS-C-111]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-ARITHMETIC-INVALID-RESULTS|WMLSCRIPT-FX-ARITHMETIC-INVALID-RESULTS]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-077",
    "WMLS-C-099",
    "WMLS-C-111"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "10.5.5",
    "heading": "10.5.5 Arithmetic Instructions",
    "normalizedTextSha256": "03ff21edb52d0369a1b702ff33c601c9c0368905c600140b2170998cbd44a813"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Return invalid for arithmetic conversion failure, division by zero, remainder by zero, or integer overflow without aborting the invocation.",
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
    "RQ-WMLS-006",
    "RQ-WMLS-007",
    "RQ-WMLS-008",
    "RQ-WMLS-010"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
