---
id: "clause:WML-CL-REFERENCE-ENTITY-CHARSET"
key: "WML-CL-REFERENCE-ENTITY-CHARSET"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Process character entities in the document character set.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-001|RQ-RMK-001]]
- `maps-to` → [[requirements/RQ-WAE-012|RQ-WAE-012]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` → [[scr-rows/WML-C-05|WML-C-05]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-REFERENCE-ENTITY-CHARSET|WML-FX-REFERENCE-ENTITY-CHARSET]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-05"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "6.1",
    "heading": "6.1 Reference Processing Model",
    "normalizedTextSha256": "6f33ed9fb7f1cbc08081e2038e54087d993d285e5ac4f7b350d02d704b62fe3f"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Process character entities in the document character set.",
  "workItems": [
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
