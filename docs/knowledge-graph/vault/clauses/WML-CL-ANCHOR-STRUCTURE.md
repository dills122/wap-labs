---
id: "clause:WML-CL-ANCHOR-STRUCTURE"
key: "WML-CL-ANCHOR-STRUCTURE"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Parse anchor content with exactly one go, prev, or refresh task.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-006|RQ-RMK-006]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` → [[scr-rows/WML-C-20|WML-C-20]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-ANCHOR-STRUCTURE|WML-FX-ANCHOR-STRUCTURE]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-20"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "9.8",
    "heading": "9.8 The Anchor Element",
    "normalizedTextSha256": "a46080b906b9b940f4fd776268cee15402c98b85d1c3330daf3b934175570234"
  },
  "normativeForce": "grammar",
  "obligationLevel": "required",
  "obligationSynopsis": "Parse anchor content with exactly one go, prev, or refresh task.",
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
