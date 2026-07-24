---
id: "clause:WBXML-CL-ATTRIBUTE-LITERAL-VALUE-PROHIBITION"
key: "WBXML-CL-ATTRIBUTE-LITERAL-VALUE-PROHIBITION"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Do not interpret LITERAL as encoding any portion of an attribute value.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-007|RQ-RMK-007]]
- `maps-to` → [[requirements/RQ-RMK-010|RQ-RMK-010]]
- `planned-by` → [[work-items/WML-203|WML-203]]
- `refines` → [[scr-rows/WBXML-C-001|WBXML-C-001]]
- `sourced-from` → [[source-documents/WAP-192-WBXML|WAP-192-WBXML]]
- `verified-by` → [[fixtures/WBXML-FX-ATTRIBUTE-LITERAL-VALUE-PROHIBITION|WBXML-FX-ATTRIBUTE-LITERAL-VALUE-PROHIBITION]]

## Data

```json
{
  "family": "wbxml",
  "parentRows": [
    "WBXML-C-001"
  ],
  "sourceAnchor": {
    "documentId": "WAP-192-WBXML",
    "section": "5.8.3",
    "heading": "5.8.3. Attribute Code Space (ATTRSTART and ATTRVALUE)",
    "normalizedTextSha256": "94ce3c51e155841c704adb5b3038d293d6b2f0dd694ab8e36857c5d6146f0408"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Do not interpret LITERAL as encoding any portion of an attribute value.",
  "workItems": [
    "R0-08",
    "T0-07",
    "WML-203"
  ],
  "ownerLayers": [
    "transport-rust"
  ],
  "requirementIds": [
    "RQ-RMK-007",
    "RQ-RMK-010"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
