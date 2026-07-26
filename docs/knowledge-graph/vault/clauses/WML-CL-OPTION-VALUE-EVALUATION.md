---
id: "clause:WML-CL-OPTION-VALUE-EVALUATION"
key: "WML-CL-OPTION-VALUE-EVALUATION"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Evaluate option value variable references before assigning the containing select name variable.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-001|RQ-RMK-001]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `planned-by` → [[work-items/WML-204|WML-204]]
- `refines` → [[scr-rows/WML-C-41|WML-C-41]]
- `refines` → [[scr-rows/WML-C-43|WML-C-43]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-OPTION-VALUE-EVALUATION|WML-FX-OPTION-VALUE-EVALUATION]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-41",
    "WML-C-43"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "11.6.2.2",
    "heading": "11.6.2.2 The Option Element",
    "normalizedTextSha256": "3653abfdab40f1491bcb57969e2e9496ebb4fd47e7d6c70479ae9aab91f30318"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Evaluate option value variable references before assigning the containing select name variable.",
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
