---
id: "clause:WML-CL-ENTITY-REQUIRED-NAMES"
key: "WML-CL-ENTITY-REQUIRED-NAMES"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Resolve the WML named entities for quotation mark, ampersand, apostrophe, less-than, greater-than, non-breaking space, and soft hyphen.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-001|RQ-RMK-001]]
- `maps-to` → [[requirements/RQ-WAE-012|RQ-WAE-012]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` → [[scr-rows/WML-C-06|WML-C-06]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-ENTITY-REQUIRED-NAMES|WML-FX-ENTITY-REQUIRED-NAMES]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-06"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "6.2",
    "heading": "6.2 Character Entities",
    "normalizedTextSha256": "c3fae14a9d46f837de2d78c058c89d9e1718a35ea61b43abb0e734a62887f0a4"
  },
  "normativeForce": "table",
  "obligationLevel": "required",
  "obligationSynopsis": "Resolve the WML named entities for quotation mark, ampersand, apostrophe, less-than, greater-than, non-breaking space, and soft hyphen.",
  "workItems": [
    "C5-06",
    "R0-01",
    "R0-08",
    "WML-201"
  ],
  "ownerLayers": [
    "engine-wasm",
    "transport-rust"
  ],
  "requirementIds": [
    "RQ-RMK-001",
    "RQ-WAE-012"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
