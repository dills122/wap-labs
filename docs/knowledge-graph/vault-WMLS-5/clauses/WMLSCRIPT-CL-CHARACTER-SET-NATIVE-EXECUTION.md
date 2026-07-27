---
id: "clause:WMLSCRIPT-CL-CHARACTER-SET-NATIVE-EXECUTION"
key: "WMLSCRIPT-CL-CHARACTER-SET-NATIVE-EXECUTION"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Perform all WMLScript string operations in one native interpreter character set, transcoding only at input or output boundaries.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-008|RQ-WMLS-008]]
- `planned-by` → [[work-items/WMLS-501|WMLS-501]]
- `refines` → [[scr-rows/WMLS-C-069|WMLS-C-069]]
- `refines` → [[scr-rows/WMLS-C-090|WMLS-C-090]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-CHARACTER-SET-NATIVE-EXECUTION|WMLSCRIPT-FX-CHARACTER-SET-NATIVE-EXECUTION]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-069",
    "WMLS-C-090"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "8.2",
    "heading": "8.2 Character Set",
    "normalizedTextSha256": "85ece72015a6d59464633edda921e251e3305b7cc891bad8d8a03c9703c12c6f"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Perform all WMLScript string operations in one native interpreter character set, transcoding only at input or output boundaries.",
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
