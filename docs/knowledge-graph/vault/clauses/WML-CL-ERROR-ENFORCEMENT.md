---
id: "clause:WML-CL-ERROR-ENFORCEMENT"
key: "WML-CL-ERROR-ENFORCEMENT"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Enforce every error condition defined by WML.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-012|RQ-RMK-012]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `planned-by` → [[work-items/WML-205|WML-205]]
- `refines` → [[scr-rows/WML-C-16|WML-C-16]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-ERROR-ENFORCEMENT|WML-FX-ERROR-ENFORCEMENT]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-16"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "12.3",
    "heading": "12.3 Error Handling",
    "normalizedTextSha256": "5878eb7729cda9ab8d71cd531aae0f2d5f4af1425b9b6bc9b21dbfe0b0e42d2b"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Enforce every error condition defined by WML.",
  "workItems": [
    "R0-01",
    "R0-07",
    "WML-201",
    "WML-205"
  ],
  "ownerLayers": [
    "browser",
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-RMK-012"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
