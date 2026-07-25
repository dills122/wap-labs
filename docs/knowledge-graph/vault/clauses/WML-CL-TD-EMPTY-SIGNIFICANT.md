---
id: "clause:WML-CL-TD-EMPTY-SIGNIFICANT"
key: "WML-CL-TD-EMPTY-SIGNIFICANT"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Preserve empty table cells during layout.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-001|RQ-RMK-001]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` → [[scr-rows/WML-C-49|WML-C-49]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-TD-EMPTY-SIGNIFICANT|WML-FX-TD-EMPTY-SIGNIFICANT]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-49"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "11.8.7",
    "heading": "11.8.7 The Td Element",
    "normalizedTextSha256": "548d28a78b6bf2cd869ad6df4ef3a26ce8dbef1d807e55424de9965db293f038"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Preserve empty table cells during layout.",
  "workItems": [
    "R0-01",
    "R0-05",
    "WML-201"
  ],
  "ownerLayers": [
    "browser",
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
