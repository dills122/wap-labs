---
id: "clause:WMLSCRIPT-CL-ERROR-ABORT-LAST-RESORT"
key: "WMLSCRIPT-CL-ERROR-ABORT-LAST-RESORT"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Use invocation abort only when the error cannot be represented by a specified non-fatal result.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-010|RQ-WMLS-010]]
- `planned-by` → [[work-items/WMLS-505|WMLS-505]]
- `refines` → [[scr-rows/WMLS-C-109|WMLS-C-109]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-ERROR-ABORT-LAST-RESORT|WMLSCRIPT-FX-ERROR-ABORT-LAST-RESORT]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-109"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "12.2",
    "heading": "12.2 Error Handling",
    "normalizedTextSha256": "2b081478fc4e86e69576759b5cd6dff61c8d52a7ad2fdf13c628bc28575464d2"
  },
  "normativeForce": "explicit-should",
  "obligationLevel": "recommended",
  "obligationSynopsis": "Use invocation abort only when the error cannot be represented by a specified non-fatal result.",
  "workItems": [
    "W1-06",
    "W1-07",
    "WMLS-505"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-010"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
