---
id: "clause:WML-CL-OPTION-ONPICK-SINGLE"
key: "WML-CL-OPTION-ONPICK-SINGLE"
type: "clause"
generated: true
slice: "WML-3"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# For single selection, dispatch onpick for the newly selected option but not for implicit deselection.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-001|RQ-RMK-001]]
- `maps-to` → [[requirements/RQ-RMK-004|RQ-RMK-004]]
- `planned-by` → [[work-items/WML-308|WML-308]]
- `refines` → [[scr-rows/WML-C-09|WML-C-09]]
- `refines` → [[scr-rows/WML-C-41|WML-C-41]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-OPTION-ONPICK-SINGLE|WML-FX-OPTION-ONPICK-SINGLE]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-41",
    "WML-C-09"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "11.6.2.2",
    "heading": "11.6.2.2 The Option Element",
    "normalizedTextSha256": "3653abfdab40f1491bcb57969e2e9496ebb4fd47e7d6c70479ae9aab91f30318"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "For single selection, dispatch onpick for the newly selected option but not for implicit deselection.",
  "workItems": [
    "R0-01",
    "R0-02",
    "R0-04",
    "WML-201",
    "WML-204",
    "WML-308"
  ],
  "ownerLayers": [
    "browser",
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-RMK-001",
    "RQ-RMK-004"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
