---
id: "clause:WML-CL-PREV-ENTRY-EVENT-PRECEDENCE"
key: "WML-CL-PREV-ENTRY-EVENT-PRECEDENCE"
type: "clause"
generated: true
slice: "WML-3"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Run a backward-entry handler before starting the restored card timer or displaying the card.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-002|RQ-RMK-002]]
- `maps-to` → [[requirements/RQ-RMK-003|RQ-RMK-003]]
- `maps-to` → [[requirements/RQ-RMK-004|RQ-RMK-004]]
- `planned-by` → [[work-items/WML-303|WML-303]]
- `refines` → [[scr-rows/WML-C-09|WML-C-09]]
- `refines` → [[scr-rows/WML-C-18|WML-C-18]]
- `refines` → [[scr-rows/WML-C-38|WML-C-38]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-PREV-ENTRY-EVENT-PRECEDENCE|WML-FX-PREV-ENTRY-EVENT-PRECEDENCE]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-09",
    "WML-C-18",
    "WML-C-38"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "12.5.2",
    "heading": "12.5.2 The Prev Task",
    "normalizedTextSha256": "4c3633fc8ac91f591164d71491637c64794cba56ce4f4558abfe9e4070fec1fa"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Run a backward-entry handler before starting the restored card timer or displaying the card.",
  "workItems": [
    "R0-01",
    "R0-02",
    "WML-201",
    "WML-303"
  ],
  "ownerLayers": [
    "browser",
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-RMK-002",
    "RQ-RMK-003",
    "RQ-RMK-004"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
