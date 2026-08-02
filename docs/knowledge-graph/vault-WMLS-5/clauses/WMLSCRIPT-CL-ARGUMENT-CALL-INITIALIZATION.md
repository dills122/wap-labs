---
id: "clause:WMLSCRIPT-CL-ARGUMENT-CALL-INITIALIZATION"
key: "WMLSCRIPT-CL-ARGUMENT-CALL-INITIALIZATION"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Pop call arguments and use them to initialize the matching callee argument variables without reordering.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-004|RQ-WMLS-004]]
- `maps-to` → [[requirements/RQ-WMLS-005|RQ-WMLS-005]]
- `planned-by` → [[work-items/WMLS-502|WMLS-502]]
- `refines` → [[scr-rows/WMLS-C-083|WMLS-C-083]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-ARGUMENT-CALL-INITIALIZATION|WMLSCRIPT-FX-ARGUMENT-CALL-INITIALIZATION]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-083"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "8.4.1",
    "heading": "8.4.1 Passing of Function Arguments",
    "normalizedTextSha256": "af9be9c8eeb8267a0eacc8bde63d7441f3cbd5bdf908f8bae3bf4eded92ffd17"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Pop call arguments and use them to initialize the matching callee argument variables without reordering.",
  "workItems": [
    "W1-04",
    "WMLS-502"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-004",
    "RQ-WMLS-005"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
