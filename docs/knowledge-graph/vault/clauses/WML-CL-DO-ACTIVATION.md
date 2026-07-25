---
id: "clause:WML-CL-DO-ACTIVATION"
key: "WML-CL-DO-ACTIVATION"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Execute the bound task when the user activates a presented do action.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-002|RQ-RMK-002]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` → [[scr-rows/WML-C-26|WML-C-26]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-DO-ACTIVATION|WML-FX-DO-ACTIVATION]]

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
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Execute the bound task when the user activates a presented do action.",
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
    "RQ-RMK-002"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
