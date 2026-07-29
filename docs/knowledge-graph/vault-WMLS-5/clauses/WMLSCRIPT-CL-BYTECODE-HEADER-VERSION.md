---
id: "clause:WMLSCRIPT-CL-BYTECODE-HEADER-VERSION"
key: "WMLSCRIPT-CL-BYTECODE-HEADER-VERSION"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Decode the version byte as major-minus-one and minor nibbles, with effective version 1.1 encoded as 0x01.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-008|RQ-WMLS-008]]
- `planned-by` → [[work-items/WMLS-501|WMLS-501]]
- `refines` → [[scr-rows/WMLS-C-091|WMLS-C-091]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-BYTECODE-HEADER-VERSION|WMLSCRIPT-FX-BYTECODE-HEADER-VERSION]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-091"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "9.3",
    "heading": "9.3 Bytecode Header",
    "normalizedTextSha256": "50ad557018fa4fde0886f6c19e3adcc39cac2ac540f57393d37f925f2576199b"
  },
  "normativeForce": "table",
  "obligationLevel": "required",
  "obligationSynopsis": "Decode the version byte as major-minus-one and minor nibbles, with effective version 1.1 encoded as 0x01.",
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
