---
id: "clause:WML-CL-VARIABLE-DOLLAR-ESCAPE"
key: "WML-CL-VARIABLE-DOLLAR-ESCAPE"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Interpret two consecutive dollar signs as one literal dollar sign in WML text and CDATA values.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-003|RQ-RMK-003]]
- `maps-to` → [[requirements/RQ-RMK-005|RQ-RMK-005]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` → [[scr-rows/WML-C-12|WML-C-12]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-VARIABLE-DOLLAR-ESCAPE|WML-FX-VARIABLE-DOLLAR-ESCAPE]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-12"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "10.3.3",
    "heading": "10.3.3 The Dollar-sign Character",
    "normalizedTextSha256": "646d3b51c0b0e61d76eb8a488752b20b1df7f18da919d4cf6d86c1d1c282e748"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Interpret two consecutive dollar signs as one literal dollar sign in WML text and CDATA values.",
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
