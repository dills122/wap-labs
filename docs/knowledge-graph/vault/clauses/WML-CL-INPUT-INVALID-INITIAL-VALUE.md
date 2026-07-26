---
id: "clause:WML-CL-INPUT-INVALID-INITIAL-VALUE"
key: "WML-CL-INPUT-INVALID-INITIAL-VALUE"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Unset an existing name value that violates the mask before attempting the declared default.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-001|RQ-RMK-001]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `planned-by` → [[work-items/WML-204|WML-204]]
- `refines` → [[scr-rows/WML-C-33|WML-C-33]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-INPUT-INVALID-INITIAL-VALUE|WML-FX-INPUT-INVALID-INITIAL-VALUE]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-33"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "11.6.3",
    "heading": "11.6.3 The Input Element",
    "normalizedTextSha256": "c5c6785fa3854527036b8508b403897658ab4e7525fce331b51eb10e86e2532e"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Unset an existing name value that violates the mask before attempting the declared default.",
  "workItems": [
    "R0-01",
    "R0-04",
    "WML-201",
    "WML-204",
    "WML-308"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-RMK-001"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
