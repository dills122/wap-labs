---
id: "clause:WMLSCRIPT-CL-BINARY-NETWORK-ORDER"
key: "WMLSCRIPT-CL-BINARY-NETWORK-ORDER"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Decode multi-byte integers and bit fields in most-significant-first network order.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-008|RQ-WMLS-008]]
- `planned-by` → [[work-items/WMLS-501|WMLS-501]]
- `refines` → [[scr-rows/WMLS-C-088|WMLS-C-088]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-BINARY-NETWORK-ORDER|WMLSCRIPT-FX-BINARY-NETWORK-ORDER]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-088"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "9.1.1",
    "heading": "9.1.1 Used Data Types",
    "normalizedTextSha256": "10d4032dc05c31055d4b2a1dd235853759bc0d7641a06b86b9c8b24bf7bfcbc0"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Decode multi-byte integers and bit fields in most-significant-first network order.",
  "workItems": [
    "W1-02",
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
