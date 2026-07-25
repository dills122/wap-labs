---
id: "clause:WML-CL-INTRINSIC-EVENT-TYPES"
key: "WML-CL-INTRINSIC-EVENT-TYPES"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Recognize timer, forward-entry, backward-entry, and option-pick intrinsic events on their defined elements.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-004|RQ-RMK-004]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` → [[scr-rows/WML-C-09|WML-C-09]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-INTRINSIC-EVENT-TYPES|WML-FX-INTRINSIC-EVENT-TYPES]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-09"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "9.10",
    "heading": "9.10 Intrinsic Events",
    "normalizedTextSha256": "c793a9617b0e789262031d31d433140e6a0265a8505a6d0f9d15c2bf7cfe87dc"
  },
  "normativeForce": "table",
  "obligationLevel": "required",
  "obligationSynopsis": "Recognize timer, forward-entry, backward-entry, and option-pick intrinsic events on their defined elements.",
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
    "RQ-RMK-004"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
