---
id: "clause:WML-CL-BR-TABLE-EFFORT"
key: "WML-CL-BR-TABLE-EFFORT"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Make a best effort to preserve br behavior inside table cells.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-001|RQ-RMK-001]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` → [[scr-rows/WML-C-24|WML-C-24]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-BR-TABLE-EFFORT|WML-FX-BR-TABLE-EFFORT]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-24"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "11.8.4",
    "heading": "11.8.4 The Br Element",
    "normalizedTextSha256": "04a782c3e912f6167be9e3240597019fc2185e0aabac294e839a74bc4047ceb3"
  },
  "normativeForce": "explicit-should",
  "obligationLevel": "recommended",
  "obligationSynopsis": "Make a best effort to preserve br behavior inside table cells.",
  "workItems": [
    "R0-01",
    "R0-05",
    "WML-201"
  ],
  "ownerLayers": [
    "browser",
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
