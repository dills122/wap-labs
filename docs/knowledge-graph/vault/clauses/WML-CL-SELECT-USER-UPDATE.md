---
id: "clause:WML-CL-SELECT-USER-UPDATE"
key: "WML-CL-SELECT-USER-UPDATE"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Update name and iname after user selection changes and again before every task invocation.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-001|RQ-RMK-001]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `planned-by` → [[work-items/WML-204|WML-204]]
- `refines` → [[scr-rows/WML-C-43|WML-C-43]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-SELECT-USER-UPDATE|WML-FX-SELECT-USER-UPDATE]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-43"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "11.6.2.1",
    "heading": "11.6.2.1 The Select Element",
    "normalizedTextSha256": "61089e6a105a3e740d7b1a3c25f204d8724e8f634c5bdae9d6ef056b87c97040"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Update name and iname after user selection changes and again before every task invocation.",
  "workItems": [
    "R0-01",
    "R0-04",
    "WML-201",
    "WML-204",
    "WML-308"
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
