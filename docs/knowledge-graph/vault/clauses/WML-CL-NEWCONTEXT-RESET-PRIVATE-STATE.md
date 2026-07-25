---
id: "clause:WML-CL-NEWCONTEXT-RESET-PRIVATE-STATE"
key: "WML-CL-NEWCONTEXT-RESET-PRIVATE-STATE"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# On newcontext initialization, reset implementation-specific context state to a documented initial value.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-003|RQ-RMK-003]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` → [[scr-rows/WML-C-11|WML-C-11]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-NEWCONTEXT-RESET-PRIVATE-STATE|WML-FX-NEWCONTEXT-RESET-PRIVATE-STATE]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-11"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "10.2",
    "heading": "10.2 The Newcontext Attribute",
    "normalizedTextSha256": "978a26211c62f8e78d2ac5e7615914c596f19b806a07d6f12261c2660d59ae8b"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "On newcontext initialization, reset implementation-specific context state to a documented initial value.",
  "workItems": [
    "R0-01",
    "R0-03",
    "WML-201"
  ],
  "ownerLayers": [
    "browser",
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-RMK-003"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
