---
id: "clause:WML-CL-TR-EMPTY-SIGNIFICANT"
key: "WML-CL-TR-EMPTY-SIGNIFICANT"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Preserve a row whose cells are all empty.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-001|RQ-RMK-001]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` → [[scr-rows/WML-C-50|WML-C-50]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-TR-EMPTY-SIGNIFICANT|WML-FX-TR-EMPTY-SIGNIFICANT]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-50"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "11.8.6",
    "heading": "11.8.6 The Tr Element",
    "normalizedTextSha256": "f6f7a974f5d6565a3a91fc85a2a82a2041cb0942a19758c364eaeb36e8e726c7"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Preserve a row whose cells are all empty.",
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
