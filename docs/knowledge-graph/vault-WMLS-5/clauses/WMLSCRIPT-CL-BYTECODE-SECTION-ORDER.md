---
id: "clause:WMLSCRIPT-CL-BYTECODE-SECTION-ORDER"
key: "WMLSCRIPT-CL-BYTECODE-SECTION-ORDER"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Decode each compilation unit in header, constant pool, pragma pool, then function pool order.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-008|RQ-WMLS-008]]
- `planned-by` → [[work-items/WMLS-501|WMLS-501]]
- `refines` → [[scr-rows/WMLS-C-069|WMLS-C-069]]
- `refines` → [[scr-rows/WMLS-C-091|WMLS-C-091]]
- `refines` → [[scr-rows/WMLS-C-092|WMLS-C-092]]
- `refines` → [[scr-rows/WMLS-C-093|WMLS-C-093]]
- `refines` → [[scr-rows/WMLS-C-094|WMLS-C-094]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-BYTECODE-SECTION-ORDER|WMLSCRIPT-FX-BYTECODE-SECTION-ORDER]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-069",
    "WMLS-C-091",
    "WMLS-C-092",
    "WMLS-C-093",
    "WMLS-C-094"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "9.2",
    "heading": "9.2 WMLScript Bytecode",
    "normalizedTextSha256": "2a9c685acc54041383a825cd08d2a1abc37fd05d98a6b2e213a4d73bad3ba40b"
  },
  "normativeForce": "table",
  "obligationLevel": "required",
  "obligationSynopsis": "Decode each compilation unit in header, constant pool, pragma pool, then function pool order.",
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
