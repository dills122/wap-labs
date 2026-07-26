---
id: "clause:WML-CL-VARIABLE-SET-DEFINITION"
key: "WML-CL-VARIABLE-SET-DEFINITION"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Treat a variable as set only when its current value is known and non-empty.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-003|RQ-RMK-003]]
- `maps-to` → [[requirements/RQ-RMK-005|RQ-RMK-005]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` → [[scr-rows/WML-C-12|WML-C-12]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-VARIABLE-SET-DEFINITION|WML-FX-VARIABLE-SET-DEFINITION]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-12"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "10.3",
    "heading": "10.3 Variables",
    "normalizedTextSha256": "cb1038afa0dfb0bb7b50003d7745c0a8d0b25fb15f2002b4b1d72fc041141f09"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Treat a variable as set only when its current value is known and non-empty.",
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
