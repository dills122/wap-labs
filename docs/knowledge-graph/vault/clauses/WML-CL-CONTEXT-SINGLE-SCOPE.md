---
id: "clause:WML-CL-CONTEXT-SINGLE-SCOPE"
key: "WML-CL-CONTEXT-SINGLE-SCOPE"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Store WML runtime state in one browser-context scope.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-003|RQ-RMK-003]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` → [[scr-rows/WML-C-10|WML-C-10]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-CONTEXT-SINGLE-SCOPE|WML-FX-CONTEXT-SINGLE-SCOPE]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-10"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "10.1",
    "heading": "10.1 The Browser Context",
    "normalizedTextSha256": "be4f27d3213e3f89e5667f274c606d1fb809da05c339e3530427692abd1bc292"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Store WML runtime state in one browser-context scope.",
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
