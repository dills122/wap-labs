---
id: "clause:WMLSCRIPT-CL-FUNCTION-POOL-INDEXES"
key: "WMLSCRIPT-CL-FUNCTION-POOL-INDEXES"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Assign zero-based function indexes by function-pool order for local call instructions.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-008|RQ-WMLS-008]]
- `planned-by` → [[work-items/WMLS-501|WMLS-501]]
- `refines` → [[scr-rows/WMLS-C-094|WMLS-C-094]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-FUNCTION-POOL-INDEXES|WMLSCRIPT-FX-FUNCTION-POOL-INDEXES]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-094"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "9.6",
    "heading": "9.6 Function Pool",
    "normalizedTextSha256": "caaaa75bad7b3f73f949f9b44447e425304aab37a00e81a42c621638f21db10e"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Assign zero-based function indexes by function-pool order for local call instructions.",
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
