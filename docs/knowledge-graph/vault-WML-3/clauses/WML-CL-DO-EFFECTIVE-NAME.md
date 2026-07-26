---
id: "clause:WML-CL-DO-EFFECTIVE-NAME"
key: "WML-CL-DO-EFFECTIVE-NAME"
type: "clause"
generated: true
slice: "WML-3"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Use the declared do name for binding identity and default a missing name to the type value.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-002|RQ-RMK-002]]
- `planned-by` → [[work-items/WML-303|WML-303]]
- `refines` → [[scr-rows/WML-C-08|WML-C-08]]
- `refines` → [[scr-rows/WML-C-26|WML-C-26]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-DO-EFFECTIVE-NAME|WML-FX-DO-EFFECTIVE-NAME]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-26",
    "WML-C-08"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "9.7",
    "heading": "9.7 The Do Element",
    "normalizedTextSha256": "2bc27d930169116f20b3b8e3a2e0f38735321034fd2fe257b78898e70f3f8d19"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Use the declared do name for binding identity and default a missing name to the type value.",
  "workItems": [
    "R0-01",
    "R0-02",
    "R0-12",
    "WML-201",
    "WML-202",
    "WML-303"
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
