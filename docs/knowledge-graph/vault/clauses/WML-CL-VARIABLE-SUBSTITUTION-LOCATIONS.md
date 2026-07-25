---
id: "clause:WML-CL-VARIABLE-SUBSTITUTION-LOCATIONS"
key: "WML-CL-VARIABLE-SUBSTITUTION-LOCATIONS"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Allow runtime variable substitution in card text and in attributes typed as vdata or HREF, but not as markup.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-003|RQ-RMK-003]]
- `maps-to` → [[requirements/RQ-RMK-005|RQ-RMK-005]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` → [[scr-rows/WML-C-12|WML-C-12]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-VARIABLE-SUBSTITUTION-LOCATIONS|WML-FX-VARIABLE-SUBSTITUTION-LOCATIONS]]

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
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Allow runtime variable substitution in card text and in attributes typed as vdata or HREF, but not as markup.",
  "workItems": [
    "R0-01",
    "R0-03",
    "WML-201"
  ],
  "ownerLayers": [
    "browser",
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-RMK-003",
    "RQ-RMK-005"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
