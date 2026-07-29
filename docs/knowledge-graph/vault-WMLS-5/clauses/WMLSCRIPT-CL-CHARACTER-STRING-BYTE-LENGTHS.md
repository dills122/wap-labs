---
id: "clause:WMLSCRIPT-CL-CHARACTER-STRING-BYTE-LENGTHS"
key: "WMLSCRIPT-CL-CHARACTER-STRING-BYTE-LENGTHS"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Interpret encoded string lengths as byte counts in the declared transfer encoding rather than character counts.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-008|RQ-WMLS-008]]
- `planned-by` → [[work-items/WMLS-501|WMLS-501]]
- `refines` → [[scr-rows/WMLS-C-090|WMLS-C-090]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-CHARACTER-STRING-BYTE-LENGTHS|WMLSCRIPT-FX-CHARACTER-STRING-BYTE-LENGTHS]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-090"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "9.1.3",
    "heading": "9.1.3 Character Encoding",
    "normalizedTextSha256": "fc1b10fc6e75bd8f173c8c539b23fff4cbb51864fd8c39e29125c4f6586e1935"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Interpret encoded string lengths as byte counts in the declared transfer encoding rather than character counts.",
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
