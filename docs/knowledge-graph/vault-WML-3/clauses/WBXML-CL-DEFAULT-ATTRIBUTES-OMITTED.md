---
id: "clause:WBXML-CL-DEFAULT-ATTRIBUTES-OMITTED"
key: "WBXML-CL-DEFAULT-ATTRIBUTES-OMITTED"
type: "clause"
generated: true
slice: "WML-3"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Accept tokenized elements that omit attributes equal to declared default, fixed, or applicable implied values.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `context-for` → [[work-items/WML-307|WML-307]]
- `maps-to` → [[requirements/RQ-RMK-007|RQ-RMK-007]]
- `maps-to` → [[requirements/RQ-RMK-010|RQ-RMK-010]]
- `refines` → [[scr-rows/WBXML-C-010|WBXML-C-010]]
- `sourced-from` → [[source-documents/WAP-192-WBXML|WAP-192-WBXML]]
- `verified-by` → [[fixtures/WBXML-FX-DEFAULT-ATTRIBUTES-OMITTED|WBXML-FX-DEFAULT-ATTRIBUTES-OMITTED]]

## Data

```json
{
  "family": "wbxml",
  "parentRows": [
    "WBXML-C-010"
  ],
  "sourceAnchor": {
    "documentId": "WAP-192-WBXML",
    "section": "6.3",
    "heading": "6.3. Encoding Default Attribute Values",
    "normalizedTextSha256": "b711774ac56016f845ec78dfc29587b6014b1c8336df08eda5d0646c85a400e0"
  },
  "normativeForce": "explicit-may",
  "obligationLevel": "permitted",
  "obligationSynopsis": "Accept tokenized elements that omit attributes equal to declared default, fixed, or applicable implied values.",
  "workItems": [
    "C5-06",
    "R0-08",
    "WML-203",
    "WML-307"
  ],
  "directWorkItems": [
    "C5-06",
    "R0-08",
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
