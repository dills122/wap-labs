---
id: "clause:WMLSCRIPT-CL-ERROR-DETECTION-TOOLS"
key: "WMLSCRIPT-CL-ERROR-DETECTION-TOOLS"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Expose value/type validation through standard library predicates plus typeof and isvalid so scripts can avoid predictable errors.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-010|RQ-WMLS-010]]
- `planned-by` → [[work-items/WMLS-505|WMLS-505]]
- `refines` → [[scr-rows/WMLS-C-109|WMLS-C-109]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-ERROR-DETECTION-TOOLS|WMLSCRIPT-FX-ERROR-DETECTION-TOOLS]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-109"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "12.1",
    "heading": "12.1 Error Detection",
    "normalizedTextSha256": "60935abf65a02c3bec838d232c8b875b01bcc0f6628506a7dcc6c49a9f8425fc"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Expose value/type validation through standard library predicates plus typeof and isvalid so scripts can avoid predictable errors.",
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
