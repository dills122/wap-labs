---
id: "clause:WBXML-CL-EMPTY-ATTRIBUTE-STRING"
key: "WBXML-CL-EMPTY-ATTRIBUTE-STRING"
type: "clause"
generated: true
slice: "WML-3"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Recognize an explicitly encoded empty string in attribute-value contexts where the application defines no other encoding.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `context-for` → [[work-items/WML-307|WML-307]]
- `maps-to` → [[requirements/RQ-RMK-007|RQ-RMK-007]]
- `maps-to` → [[requirements/RQ-RMK-010|RQ-RMK-010]]
- `refines` → [[scr-rows/WBXML-C-001|WBXML-C-001]]
- `sourced-from` → [[source-documents/WAP-192-WBXML|WAP-192-WBXML]]
- `verified-by` → [[fixtures/WBXML-FX-EMPTY-ATTRIBUTE-STRING|WBXML-FX-EMPTY-ATTRIBUTE-STRING]]

## Data

```json
{
  "family": "wbxml",
  "parentRows": [
    "WBXML-C-001"
  ],
  "sourceAnchor": {
    "documentId": "WAP-192-WBXML",
    "section": "5.8.4.1",
    "heading": "5.8.4.1. Strings",
    "normalizedTextSha256": "b92248bcacf7045955449f2de3ecdf8db3c177a439e37e98df03713bd240c7e5"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Recognize an explicitly encoded empty string in attribute-value contexts where the application defines no other encoding.",
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
