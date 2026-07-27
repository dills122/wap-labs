---
id: "clause:WMLSCRIPT-CL-LOCAL-EMPTY-INITIALIZATION"
key: "WMLSCRIPT-CL-LOCAL-EMPTY-INITIALIZATION"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Initialize every function local variable to an empty string before executing the function body.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-004|RQ-WMLS-004]]
- `maps-to` → [[requirements/RQ-WMLS-005|RQ-WMLS-005]]
- `planned-by` → [[work-items/WMLS-502|WMLS-502]]
- `refines` → [[scr-rows/WMLS-C-086|WMLS-C-086]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-LOCAL-EMPTY-INITIALIZATION|WMLSCRIPT-FX-LOCAL-EMPTY-INITIALIZATION]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-086"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "8.4.4",
    "heading": "8.4.4 Initialisation of Variables",
    "normalizedTextSha256": "5078c87a0c9d756b69cb5a46d3727f6abdd39693f62df51fae8a678aa782be7f"
  },
  "normativeForce": "explicit-should",
  "obligationLevel": "recommended",
  "obligationSynopsis": "Initialize every function local variable to an empty string before executing the function body.",
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
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
