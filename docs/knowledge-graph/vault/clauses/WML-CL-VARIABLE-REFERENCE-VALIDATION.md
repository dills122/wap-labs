---
id: "clause:WML-CL-VARIABLE-REFERENCE-VALIDATION"
key: "WML-CL-VARIABLE-REFERENCE-VALIDATION"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Reject a deck when a variable reference has invalid syntax or appears outside a permitted text or attribute location.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-003|RQ-RMK-003]]
- `maps-to` → [[requirements/RQ-RMK-005|RQ-RMK-005]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` → [[scr-rows/WML-C-12|WML-C-12]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-VARIABLE-REFERENCE-VALIDATION|WML-FX-VARIABLE-REFERENCE-VALIDATION]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-12"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "10.3.5",
    "heading": "10.3.5 Validation",
    "normalizedTextSha256": "7c8a2ebfc7c1b8cdfa7c7fb9de65558b3e082cd1f116cf2e7985e7b367af7be9"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Reject a deck when a variable reference has invalid syntax or appears outside a permitted text or attribute location.",
  "workItems": [
    "R0-01",
    "R0-03",
    "WML-201",
    "WML-302"
  ],
  "ownerLayers": [
    "browser",
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-RMK-003",
    "RQ-RMK-005"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
