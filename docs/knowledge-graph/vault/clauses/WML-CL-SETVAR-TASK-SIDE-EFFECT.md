---
id: "clause:WML-CL-SETVAR-TASK-SIDE-EFFECT"
key: "WML-CL-SETVAR-TASK-SIDE-EFFECT"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Apply a valid setvar assignment only as a side effect of executing its containing task.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-002|RQ-RMK-002]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` → [[scr-rows/WML-C-52|WML-C-52]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-SETVAR-TASK-SIDE-EFFECT|WML-FX-SETVAR-TASK-SIDE-EFFECT]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-52"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "9.4",
    "heading": "9.4 The Setvar Element",
    "normalizedTextSha256": "351155436bd3b04d57f1a0995afa3f0ed55ab568bcd375410219cee4aaa4aa9e"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Apply a valid setvar assignment only as a side effect of executing its containing task.",
  "workItems": [
    "R0-01",
    "R0-02",
    "R0-06",
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
