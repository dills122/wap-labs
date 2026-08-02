---
id: "clause:WMLSCRIPT-CL-AUTOMATIC-EMPTY-RETURN"
key: "WMLSCRIPT-CL-AUTOMATIC-EMPTY-RETURN"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Return an empty string when execution reaches a function end without a return instruction.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-004|RQ-WMLS-004]]
- `maps-to` → [[requirements/RQ-WMLS-005|RQ-WMLS-005]]
- `planned-by` → [[work-items/WMLS-502|WMLS-502]]
- `refines` → [[scr-rows/WMLS-C-085|WMLS-C-085]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-AUTOMATIC-EMPTY-RETURN|WMLSCRIPT-FX-AUTOMATIC-EMPTY-RETURN]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-085"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "8.4.3",
    "heading": "8.4.3 Automatic Function Return Value",
    "normalizedTextSha256": "b3107abc7a0cbe8f376624fde499d850bd73576f3f8e20bd411a1fc42f5379e7"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Return an empty string when execution reaches a function end without a return instruction.",
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
