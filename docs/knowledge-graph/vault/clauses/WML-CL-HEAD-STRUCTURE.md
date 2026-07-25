---
id: "clause:WML-CL-HEAD-STRUCTURE"
key: "WML-CL-HEAD-STRUCTURE"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# When head is present, require one or more access or meta children.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-001|RQ-RMK-001]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` → [[scr-rows/WML-C-30|WML-C-30]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-HEAD-STRUCTURE|WML-FX-HEAD-STRUCTURE]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-30"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "11.3",
    "heading": "11.3 The Head Element",
    "normalizedTextSha256": "2f300f2dcd2657797cb3055cfe175afb7b299922d420de56726f324b977a8c41"
  },
  "normativeForce": "grammar",
  "obligationLevel": "required",
  "obligationSynopsis": "When head is present, require one or more access or meta children.",
  "workItems": [
    "R0-01",
    "R0-04",
    "WML-201"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-RMK-001"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
