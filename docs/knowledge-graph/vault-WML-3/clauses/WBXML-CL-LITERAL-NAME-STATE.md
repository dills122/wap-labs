---
id: "clause:WBXML-CL-LITERAL-NAME-STATE"
key: "WBXML-CL-LITERAL-NAME-STATE"
type: "clause"
generated: true
slice: "WML-3"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Interpret a LITERAL name as a tag or attribute according to parser state and resolve its name through the string table.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `context-for` → [[work-items/WML-307|WML-307]]
- `maps-to` → [[requirements/RQ-RMK-007|RQ-RMK-007]]
- `maps-to` → [[requirements/RQ-RMK-010|RQ-RMK-010]]
- `refines` → [[scr-rows/WBXML-C-001|WBXML-C-001]]
- `refines` → [[scr-rows/WBXML-C-011|WBXML-C-011]]
- `sourced-from` → [[source-documents/WAP-192-WBXML|WAP-192-WBXML]]
- `verified-by` → [[fixtures/WBXML-FX-LITERAL-NAME-STATE|WBXML-FX-LITERAL-NAME-STATE]]

## Data

```json
{
  "family": "wbxml",
  "parentRows": [
    "WBXML-C-001",
    "WBXML-C-011"
  ],
  "sourceAnchor": {
    "documentId": "WAP-192-WBXML",
    "section": "5.8.4.5",
    "heading": "5.8.4.5. Literal Tag or Attribute Name",
    "normalizedTextSha256": "d28c6bf23616d9465cb53fcb405428844d26b9276e021ed0d53006a3e1080f46"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Interpret a LITERAL name as a tag or attribute according to parser state and resolve its name through the string table.",
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
