---
id: "clause:WBXML-CL-LITERAL-TAG-FLAGS"
key: "WBXML-CL-LITERAL-TAG-FLAGS"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Honor the attribute and content flags encoded by LITERAL_A, LITERAL_C, and LITERAL_AC.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-007|RQ-RMK-007]]
- `maps-to` → [[requirements/RQ-RMK-010|RQ-RMK-010]]
- `planned-by` → [[work-items/WML-203|WML-203]]
- `refines` → [[scr-rows/WBXML-C-001|WBXML-C-001]]
- `refines` → [[scr-rows/WBXML-C-011|WBXML-C-011]]
- `sourced-from` → [[source-documents/WAP-192-WBXML|WAP-192-WBXML]]
- `verified-by` → [[fixtures/WBXML-FX-LITERAL-TAG-FLAGS|WBXML-FX-LITERAL-TAG-FLAGS]]

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
  "obligationSynopsis": "Honor the attribute and content flags encoded by LITERAL_A, LITERAL_C, and LITERAL_AC.",
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
