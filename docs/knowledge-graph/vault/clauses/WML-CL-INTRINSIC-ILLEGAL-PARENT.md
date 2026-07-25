---
id: "clause:WML-CL-INTRINSIC-ILLEGAL-PARENT"
key: "WML-CL-INTRINSIC-ILLEGAL-PARENT"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Ignore onevent bindings whose event type is not legal for the immediately enclosing element.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-002|RQ-RMK-002]]
- `maps-to` → [[requirements/RQ-RMK-004|RQ-RMK-004]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` → [[scr-rows/WML-C-09|WML-C-09]]
- `refines` → [[scr-rows/WML-C-39|WML-C-39]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-INTRINSIC-ILLEGAL-PARENT|WML-FX-INTRINSIC-ILLEGAL-PARENT]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-09",
    "WML-C-39"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "9.10.1",
    "heading": "9.10.1 The Onevent Element",
    "normalizedTextSha256": "a01f086468a9cddbbd5867dc0aed7678bef369a37588a2f6d7ac422ce673c743"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Ignore onevent bindings whose event type is not legal for the immediately enclosing element.",
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
    "RQ-RMK-002",
    "RQ-RMK-004"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
