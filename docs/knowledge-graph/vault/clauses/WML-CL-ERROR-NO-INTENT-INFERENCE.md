---
id: "clause:WML-CL-ERROR-NO-INTENT-INFERENCE"
key: "WML-CL-ERROR-NO-INTENT-INFERENCE"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Do not hide invalid decks by guessing author or origin-server intent.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-012|RQ-RMK-012]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `planned-by` → [[work-items/WML-205|WML-205]]
- `refines` → [[scr-rows/WML-C-16|WML-C-16]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-ERROR-NO-INTENT-INFERENCE|WML-FX-ERROR-NO-INTENT-INFERENCE]]

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
  "obligationSynopsis": "Do not hide invalid decks by guessing author or origin-server intent.",
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
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
