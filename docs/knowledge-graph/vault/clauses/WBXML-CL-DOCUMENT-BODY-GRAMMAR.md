---
id: "clause:WBXML-CL-DOCUMENT-BODY-GRAMMAR"
key: "WBXML-CL-DOCUMENT-BODY-GRAMMAR"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Enforce the WBXML element, attribute, content, string, entity, processing-instruction, extension, and opaque-data grammar.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-007|RQ-RMK-007]]
- `maps-to` → [[requirements/RQ-RMK-010|RQ-RMK-010]]
- `planned-by` → [[work-items/WML-203|WML-203]]
- `refines` → [[scr-rows/WBXML-C-001|WBXML-C-001]]
- `sourced-from` → [[source-documents/WAP-192-WBXML|WAP-192-WBXML]]
- `verified-by` → [[fixtures/WBXML-FX-DOCUMENT-BODY-GRAMMAR|WBXML-FX-DOCUMENT-BODY-GRAMMAR]]

## Data

```json
{
  "family": "wbxml",
  "parentRows": [
    "WBXML-C-001"
  ],
  "sourceAnchor": {
    "documentId": "WAP-192-WBXML",
    "section": "5.3",
    "heading": "5.3. BNF for Document Structure",
    "normalizedTextSha256": "fd703e1204d3a97c030e345189f2b3519a47a1e9c1339fe1ababa0c426f4e8dd"
  },
  "normativeForce": "grammar",
  "obligationLevel": "required",
  "obligationSynopsis": "Enforce the WBXML element, attribute, content, string, entity, processing-instruction, extension, and opaque-data grammar.",
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
