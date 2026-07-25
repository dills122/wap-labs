---
id: "clause:WML-CL-TEMPLATE-STRUCTURE"
key: "WML-CL-TEMPLATE-STRUCTURE"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Parse template as zero or more do or onevent bindings plus card-event attributes.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-001|RQ-RMK-001]]
- `planned-by` → [[work-items/WML-202|WML-202]]
- `refines` → [[scr-rows/WML-C-47|WML-C-47]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-TEMPLATE-STRUCTURE|WML-FX-TEMPLATE-STRUCTURE]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-47"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "11.4",
    "heading": "11.4 The Template Element",
    "normalizedTextSha256": "d5511025552598715b52f573fae5bd7e89923f27d0b1f459a0b3b4bf8b57fba7"
  },
  "normativeForce": "grammar",
  "obligationLevel": "required",
  "obligationSynopsis": "Parse template as zero or more do or onevent bindings plus card-event attributes.",
  "workItems": [
    "R0-01",
    "R0-04",
    "R0-12",
    "WML-202"
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
