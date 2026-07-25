---
id: "clause:WML-CL-A-NO-NESTING"
key: "WML-CL-A-NO-NESTING"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Reject nested a elements.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-006|RQ-RMK-006]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` → [[scr-rows/WML-C-19|WML-C-19]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-A-NO-NESTING|WML-FX-A-NO-NESTING]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-19"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "9.9",
    "heading": "9.9 The A Element",
    "normalizedTextSha256": "80bb8d6e4065b11af4457d86cd23de7e9f5716a1393b4cadf4446a551fe69f59"
  },
  "normativeForce": "error-condition",
  "obligationLevel": "required",
  "obligationSynopsis": "Reject nested a elements.",
  "workItems": [
    "R0-01",
    "R0-02",
    "WML-201"
  ],
  "ownerLayers": [
    "browser",
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-RMK-006"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
