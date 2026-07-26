---
id: "clause:WML-CL-WML-ROOT-DECK-SCOPE"
key: "WML-CL-WML-ROOT-DECK-SCOPE"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Treat the wml element as the enclosing scope for every card and all deck-level information.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-001|RQ-RMK-001]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `planned-by` → [[work-items/WML-202|WML-202]]
- `refines` → [[scr-rows/WML-C-53|WML-C-53]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-WML-ROOT-DECK-SCOPE|WML-FX-WML-ROOT-DECK-SCOPE]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-53"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "11.2",
    "heading": "11.2 The WML Element",
    "normalizedTextSha256": "62007e92c08b8bdb5140bb41b1fa774a43f92cc132e7e0647665a7b4a5e55b92"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Treat the wml element as the enclosing scope for every card and all deck-level information.",
  "workItems": [
    "C5-03",
    "R0-01",
    "R0-04",
    "WML-201",
    "WML-202"
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
