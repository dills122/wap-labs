---
id: "clause:WMLSCRIPT-CL-FUNCTION-NAME-TABLE"
key: "WMLSCRIPT-CL-FUNCTION-NAME-TABLE"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Store only external function names in the name table and preserve their function-pool order.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-001|RQ-WMLS-001]]
- `maps-to` → [[requirements/RQ-WMLS-002|RQ-WMLS-002]]
- `maps-to` → [[requirements/RQ-WMLS-003|RQ-WMLS-003]]
- `maps-to` → [[requirements/RQ-WMLS-008|RQ-WMLS-008]]
- `planned-by` → [[work-items/WMLS-501|WMLS-501]]
- `planned-by` → [[work-items/WMLS-503|WMLS-503]]
- `refines` → [[scr-rows/WMLS-C-079|WMLS-C-079]]
- `refines` → [[scr-rows/WMLS-C-087|WMLS-C-087]]
- `refines` → [[scr-rows/WMLS-C-094|WMLS-C-094]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-FUNCTION-NAME-TABLE|WMLSCRIPT-FX-FUNCTION-NAME-TABLE]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-079",
    "WMLS-C-087",
    "WMLS-C-094"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "9.6",
    "heading": "9.6 Function Pool",
    "normalizedTextSha256": "caaaa75bad7b3f73f949f9b44447e425304aab37a00e81a42c621638f21db10e"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Store only external function names in the name table and preserve their function-pool order.",
  "workItems": [
    "W0-08",
    "W1-02",
    "W1-03",
    "WMLS-501",
    "WMLS-503"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-001",
    "RQ-WMLS-002",
    "RQ-WMLS-003",
    "RQ-WMLS-008"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
