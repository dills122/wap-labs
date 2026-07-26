---
id: "clause:WML-CL-ONEVENT-SINGLE-TASK"
key: "WML-CL-ONEVENT-SINGLE-TASK"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Parse onevent as exactly one go, prev, noop, or refresh task associated with its immediately enclosing element.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-002|RQ-RMK-002]]
- `maps-to` → [[requirements/RQ-RMK-004|RQ-RMK-004]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `planned-by` → [[work-items/WML-203|WML-203]]
- `refines` → [[scr-rows/WML-C-39|WML-C-39]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-ONEVENT-SINGLE-TASK|WML-FX-ONEVENT-SINGLE-TASK]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-39"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "9.10.1",
    "heading": "9.10.1 The Onevent Element",
    "normalizedTextSha256": "a01f086468a9cddbbd5867dc0aed7678bef369a37588a2f6d7ac422ce673c743"
  },
  "normativeForce": "grammar",
  "obligationLevel": "required",
  "obligationSynopsis": "Parse onevent as exactly one go, prev, noop, or refresh task associated with its immediately enclosing element.",
  "workItems": [
    "R0-01",
    "R0-02",
    "WML-201",
    "WML-203"
  ],
  "ownerLayers": [
    "browser",
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-RMK-002",
    "RQ-RMK-004"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
