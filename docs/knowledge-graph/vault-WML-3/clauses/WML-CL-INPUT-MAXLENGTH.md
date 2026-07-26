---
id: "clause:WML-CL-INPUT-MAXLENGTH"
key: "WML-CL-INPUT-MAXLENGTH"
type: "clause"
generated: true
slice: "WML-3"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Limit committed text to maxlength when that attribute is present.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-001|RQ-RMK-001]]
- `planned-by` → [[work-items/WML-308|WML-308]]
- `refines` → [[scr-rows/WML-C-33|WML-C-33]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-INPUT-MAXLENGTH|WML-FX-INPUT-MAXLENGTH]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-33"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "11.6.3",
    "heading": "11.6.3 The Input Element",
    "normalizedTextSha256": "c5c6785fa3854527036b8508b403897658ab4e7525fce331b51eb10e86e2532e"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Limit committed text to maxlength when that attribute is present.",
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
