---
id: "clause:WBXML-CL-MULTIBYTE-GROUP-ORDER"
key: "WBXML-CL-MULTIBYTE-GROUP-ORDER"
type: "clause"
generated: true
slice: "WML-3"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Combine multi-byte integer groups in most-significant-group-first order.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `context-for` → [[work-items/WML-307|WML-307]]
- `maps-to` → [[requirements/RQ-RMK-007|RQ-RMK-007]]
- `maps-to` → [[requirements/RQ-RMK-010|RQ-RMK-010]]
- `refines` → [[scr-rows/WBXML-C-001|WBXML-C-001]]
- `sourced-from` → [[source-documents/WAP-192-WBXML|WAP-192-WBXML]]
- `verified-by` → [[fixtures/WBXML-FX-MULTIBYTE-GROUP-ORDER|WBXML-FX-MULTIBYTE-GROUP-ORDER]]

## Data

```json
{
  "family": "wbxml",
  "parentRows": [
    "WBXML-C-001"
  ],
  "sourceAnchor": {
    "documentId": "WAP-192-WBXML",
    "section": "5.1",
    "heading": "5.1. Multi-byte Integers",
    "normalizedTextSha256": "8083476edb9b067532218f74441007805212edc95007d1f19edd99d8d7926579"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Combine multi-byte integer groups in most-significant-group-first order.",
  "workItems": [
    "C5-06",
    "R0-08",
    "T0-07",
    "WML-203",
    "WML-307"
  ],
  "directWorkItems": [
    "C5-06",
    "R0-08",
    "T0-07",
    "WML-203"
  ],
  "aggregateContextWorkItems": [
    "WML-307"
  ],
  "ownerLayers": [
    "transport-rust"
  ],
  "requirementIds": [
    "RQ-RMK-007",
    "RQ-RMK-010"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
