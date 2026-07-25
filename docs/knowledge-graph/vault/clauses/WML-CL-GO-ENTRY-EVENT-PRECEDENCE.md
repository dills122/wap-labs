---
id: "clause:WML-CL-GO-ENTRY-EVENT-PRECEDENCE"
key: "WML-CL-GO-ENTRY-EVENT-PRECEDENCE"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Run a destination forward-entry handler before starting its timer or displaying the card, and stop the current traversal when it runs.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-002|RQ-RMK-002]]
- `maps-to` → [[requirements/RQ-RMK-003|RQ-RMK-003]]
- `maps-to` → [[requirements/RQ-RMK-004|RQ-RMK-004]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` → [[scr-rows/WML-C-09|WML-C-09]]
- `refines` → [[scr-rows/WML-C-18|WML-C-18]]
- `refines` → [[scr-rows/WML-C-29|WML-C-29]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-GO-ENTRY-EVENT-PRECEDENCE|WML-FX-GO-ENTRY-EVENT-PRECEDENCE]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-09",
    "WML-C-18",
    "WML-C-29"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "12.5.1",
    "heading": "12.5.1 The Go Task",
    "normalizedTextSha256": "64953475f2bdd343ead6d19fab5489ca50c840303fc961f186284ccef87bab9c"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Run a destination forward-entry handler before starting its timer or displaying the card, and stop the current traversal when it runs.",
  "workItems": [
    "R0-01",
    "R0-02",
    "R0-06",
    "WML-201"
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
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
