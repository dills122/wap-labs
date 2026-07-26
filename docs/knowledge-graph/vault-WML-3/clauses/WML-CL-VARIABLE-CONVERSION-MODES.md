---
id: "clause:WML-CL-VARIABLE-CONVERSION-MODES"
key: "WML-CL-VARIABLE-CONVERSION-MODES"
type: "clause"
generated: true
slice: "WML-3"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Implement no-escape, URL-escape, and URL-unescape substitution conversions without mutating the stored value.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-003|RQ-RMK-003]]
- `maps-to` → [[requirements/RQ-RMK-005|RQ-RMK-005]]
- `planned-by` → [[work-items/WML-302|WML-302]]
- `refines` → [[scr-rows/WML-C-12|WML-C-12]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-VARIABLE-CONVERSION-MODES|WML-FX-VARIABLE-CONVERSION-MODES]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-12"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "10.3.1",
    "heading": "10.3.1 Variable Substitution",
    "normalizedTextSha256": "9849f9672c816afb631c60353168ab6e789a48a110f800b6cd51e2ecb0055c8f"
  },
  "normativeForce": "table",
  "obligationLevel": "required",
  "obligationSynopsis": "Implement no-escape, URL-escape, and URL-unescape substitution conversions without mutating the stored value.",
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
