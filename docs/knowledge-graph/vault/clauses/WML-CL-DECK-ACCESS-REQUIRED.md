---
id: "clause:WML-CL-DECK-ACCESS-REQUIRED"
key: "WML-CL-DECK-ACCESS-REQUIRED"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Enforce deck-level access control using access, sendreferer, domain, and path semantics.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-001|RQ-RMK-001]]
- `maps-to` → [[requirements/RQ-RMK-011|RQ-RMK-011]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` → [[scr-rows/WML-C-14|WML-C-14]]
- `refines` → [[scr-rows/WML-C-21|WML-C-21]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-DECK-ACCESS-REQUIRED|WML-FX-DECK-ACCESS-REQUIRED]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-14",
    "WML-C-21"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "12.1",
    "heading": "12.1 Deck Access Control",
    "normalizedTextSha256": "c4a0bb8d0ea624a1442364e50aee2d78267f8641ad78f525550f06fa8fe3576d"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Enforce deck-level access control using access, sendreferer, domain, and path semantics.",
  "workItems": [
    "C5-03",
    "R0-01",
    "R0-04",
    "R0-07",
    "WML-201"
  ],
  "ownerLayers": [
    "browser",
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-RMK-001",
    "RQ-RMK-011"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
