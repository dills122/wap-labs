---
id: "clause:WML-CL-PROLOGUE-REQUIRED"
key: "WML-CL-PROLOGUE-REQUIRED"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Require textual WML decks to contain both an XML declaration and a document type declaration; tokenized WBXML supplies equivalent header metadata at its boundary.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-001|RQ-RMK-001]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `planned-by` → [[work-items/WML-203|WML-203]]
- `refines` → [[scr-rows/WML-C-53|WML-C-53]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-PROLOGUE-REQUIRED|WML-FX-PROLOGUE-REQUIRED]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-53"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "11.1",
    "heading": "11.1 Document Prologue",
    "normalizedTextSha256": "ba28b2c2d6f368d72a6871e8f77133e1445a11146c102690d5b47fe52380daad"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Require textual WML decks to contain both an XML declaration and a document type declaration; tokenized WBXML supplies equivalent header metadata at its boundary.",
  "workItems": [
    "C5-03",
    "R0-01",
    "R0-04",
    "WML-201",
    "WML-203"
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
