---
id: "clause:WML-CL-GO-ACCESS-BEFORE-TRANSITION"
key: "WML-CL-GO-ACCESS-BEFORE-TRANSITION"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Evaluate destination-deck access control before committing the card transition.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-002|RQ-RMK-002]]
- `maps-to` → [[requirements/RQ-RMK-003|RQ-RMK-003]]
- `maps-to` → [[requirements/RQ-RMK-011|RQ-RMK-011]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` → [[scr-rows/WML-C-14|WML-C-14]]
- `refines` → [[scr-rows/WML-C-18|WML-C-18]]
- `refines` → [[scr-rows/WML-C-29|WML-C-29]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-GO-ACCESS-BEFORE-TRANSITION|WML-FX-GO-ACCESS-BEFORE-TRANSITION]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-14",
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
  "obligationSynopsis": "Evaluate destination-deck access control before committing the card transition.",
  "workItems": [
    "R0-01",
    "R0-02",
    "R0-06",
    "R0-07",
    "WML-201"
  ],
  "ownerLayers": [
    "browser",
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-RMK-002",
    "RQ-RMK-003",
    "RQ-RMK-011"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
