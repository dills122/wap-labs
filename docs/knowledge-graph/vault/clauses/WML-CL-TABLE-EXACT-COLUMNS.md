---
id: "clause:WML-CL-TABLE-EXACT-COLUMNS"
key: "WML-CL-TABLE-EXACT-COLUMNS"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Create exactly the positive number of columns declared by the required columns attribute.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-001|RQ-RMK-001]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` → [[scr-rows/WML-C-46|WML-C-46]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-TABLE-EXACT-COLUMNS|WML-FX-TABLE-EXACT-COLUMNS]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-46"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "11.8.5",
    "heading": "11.8.5 The Table Element",
    "normalizedTextSha256": "bf3c83df18b33320fa497a4d15a284c00dfa4b92e93505d0d2618213b35c27d3"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Create exactly the positive number of columns declared by the required columns attribute.",
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
