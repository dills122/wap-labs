---
id: "clause:WML-CL-DO-TYPE-ACCEPTANCE"
key: "WML-CL-DO-TYPE-ACCEPTANCE"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Accept every do type and treat an unrecognized type as unknown when no specialized mapping exists.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-002|RQ-RMK-002]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` → [[scr-rows/WML-C-26|WML-C-26]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-DO-TYPE-ACCEPTANCE|WML-FX-DO-TYPE-ACCEPTANCE]]

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
  "obligationSynopsis": "Accept every do type and treat an unrecognized type as unknown when no specialized mapping exists.",
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
