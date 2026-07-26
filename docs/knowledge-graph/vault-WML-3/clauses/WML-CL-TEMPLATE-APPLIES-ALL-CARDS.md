---
id: "clause:WML-CL-TEMPLATE-APPLIES-ALL-CARDS"
key: "WML-CL-TEMPLATE-APPLIES-ALL-CARDS"
type: "clause"
generated: true
slice: "WML-3"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Apply each template event binding as though it were declared in every card unless shadowed.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-001|RQ-RMK-001]]
- `planned-by` → [[work-items/WML-303|WML-303]]
- `refines` → [[scr-rows/WML-C-47|WML-C-47]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-TEMPLATE-APPLIES-ALL-CARDS|WML-FX-TEMPLATE-APPLIES-ALL-CARDS]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-47"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "11.4",
    "heading": "11.4 The Template Element",
    "normalizedTextSha256": "d5511025552598715b52f573fae5bd7e89923f27d0b1f459a0b3b4bf8b57fba7"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Apply each template event binding as though it were declared in every card unless shadowed.",
  "workItems": [
    "R0-01",
    "R0-04",
    "R0-12",
    "WML-201",
    "WML-202",
    "WML-303"
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
