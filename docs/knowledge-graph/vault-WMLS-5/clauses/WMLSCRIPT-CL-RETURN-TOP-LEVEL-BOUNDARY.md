---
id: "clause:WMLSCRIPT-CL-RETURN-TOP-LEVEL-BOUNDARY"
key: "WMLSCRIPT-CL-RETURN-TOP-LEVEL-BOUNDARY"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Return the selected value to the host caller when leaving the top-level invoked WMLScript function.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-004|RQ-WMLS-004]]
- `maps-to` → [[requirements/RQ-WMLS-005|RQ-WMLS-005]]
- `maps-to` → [[requirements/RQ-WMLS-008|RQ-WMLS-008]]
- `planned-by` → [[work-items/WMLS-501|WMLS-501]]
- `planned-by` → [[work-items/WMLS-502|WMLS-502]]
- `refines` → [[scr-rows/WMLS-C-085|WMLS-C-085]]
- `refines` → [[scr-rows/WMLS-C-105|WMLS-C-105]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-RETURN-TOP-LEVEL-BOUNDARY|WMLSCRIPT-FX-RETURN-TOP-LEVEL-BOUNDARY]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-085",
    "WMLS-C-105"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "10.5.11",
    "heading": "10.5.11 Function Return Instructions",
    "normalizedTextSha256": "b0cb050868bdb8f2d6d1fd8d62896167a365afe418ad1d2f663714d0c146af3b"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Return the selected value to the host caller when leaving the top-level invoked WMLScript function.",
  "workItems": [
    "W1-02",
    "W1-04",
    "WMLS-501",
    "WMLS-502"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-004",
    "RQ-WMLS-005",
    "RQ-WMLS-008"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
