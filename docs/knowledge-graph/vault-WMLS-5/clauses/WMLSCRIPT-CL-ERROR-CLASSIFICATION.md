---
id: "clause:WMLSCRIPT-CL-ERROR-CLASSIFICATION"
key: "WMLSCRIPT-CL-ERROR-CLASSIFICATION"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Classify each specified runtime error as fatal or non-fatal and apply its defined caller-visible outcome.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-010|RQ-WMLS-010]]
- `planned-by` → [[work-items/WMLS-505|WMLS-505]]
- `refines` → [[scr-rows/WMLS-C-109|WMLS-C-109]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-ERROR-CLASSIFICATION|WMLSCRIPT-FX-ERROR-CLASSIFICATION]]

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
  "normativeForce": "table",
  "obligationLevel": "required",
  "obligationSynopsis": "Classify each specified runtime error as fatal or non-fatal and apply its defined caller-visible outcome.",
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
