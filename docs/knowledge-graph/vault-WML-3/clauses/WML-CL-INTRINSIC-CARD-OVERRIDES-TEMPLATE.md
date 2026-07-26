---
id: "clause:WML-CL-INTRINSIC-CARD-OVERRIDES-TEMPLATE"
key: "WML-CL-INTRINSIC-CARD-OVERRIDES-TEMPLATE"
type: "clause"
generated: true
slice: "WML-3"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Give a card-level forward-entry, backward-entry, or timer handler precedence over a template handler regardless of syntax.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-001|RQ-RMK-001]]
- `maps-to` → [[requirements/RQ-RMK-002|RQ-RMK-002]]
- `maps-to` → [[requirements/RQ-RMK-004|RQ-RMK-004]]
- `planned-by` → [[work-items/WML-303|WML-303]]
- `refines` → [[scr-rows/WML-C-08|WML-C-08]]
- `refines` → [[scr-rows/WML-C-09|WML-C-09]]
- `refines` → [[scr-rows/WML-C-47|WML-C-47]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-INTRINSIC-CARD-OVERRIDES-TEMPLATE|WML-FX-INTRINSIC-CARD-OVERRIDES-TEMPLATE]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-08",
    "WML-C-09",
    "WML-C-47"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "9.10.2",
    "heading": "9.10.2 Card/Deck Intrinsic Events",
    "normalizedTextSha256": "8487b58f882f6ed366a42d049e0b772db1b300e82d271fa4ff3f0ac69d16e018"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Give a card-level forward-entry, backward-entry, or timer handler precedence over a template handler regardless of syntax.",
  "workItems": [
    "R0-01",
    "R0-02",
    "R0-04",
    "R0-12",
    "WML-201",
    "WML-202",
    "WML-303"
  ],
  "ownerLayers": [
    "browser",
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-RMK-001",
    "RQ-RMK-002",
    "RQ-RMK-004"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
