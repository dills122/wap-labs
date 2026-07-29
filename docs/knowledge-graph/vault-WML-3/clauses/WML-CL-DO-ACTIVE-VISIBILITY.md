---
id: "clause:WML-CL-DO-ACTIVE-VISIBILITY"
key: "WML-CL-DO-ACTIVE-VISIBILITY"
type: "clause"
generated: true
slice: "WML-3"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Make every active, non-optional do accessible for user activation.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-002|RQ-RMK-002]]
- `planned-by` → [[work-items/WML-309|WML-309]]
- `refines` → [[scr-rows/WML-C-26|WML-C-26]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-DO-ACTIVE-VISIBILITY|WML-FX-DO-ACTIVE-VISIBILITY]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-26"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "9.7",
    "heading": "9.7 The Do Element",
    "normalizedTextSha256": "2bc27d930169116f20b3b8e3a2e0f38735321034fd2fe257b78898e70f3f8d19"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Make every active, non-optional do accessible for user activation.",
  "workItems": [
    "R0-01",
    "R0-02",
    "WML-201",
    "WML-309"
  ],
  "ownerLayers": [
    "browser",
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-RMK-002"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
