---
id: "clause:WML-CL-CARD-COLLECTION"
key: "WML-CL-CARD-COLLECTION"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Represent a WML deck as a collection containing at least one card.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-001|RQ-RMK-001]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` → [[scr-rows/WML-C-25|WML-C-25]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-CARD-COLLECTION|WML-FX-CARD-COLLECTION]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-25"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "11.5",
    "heading": "11.5 The Card Element",
    "normalizedTextSha256": "942cd7a88f7b7dded094ccb275cf652f4dfcfc9c02359b06d97a4889fac5aa05"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Represent a WML deck as a collection containing at least one card.",
  "workItems": [
    "R0-01",
    "R0-04",
    "WML-201"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-RMK-001"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
