---
id: "clause:WML-CL-UNKNOWN-CONTENT-PRESERVED"
key: "WML-CL-UNKNOWN-CONTENT-PRESERVED"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Continue rendering recognized content nested inside an unrecognized element.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-009|RQ-RMK-009]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `planned-by` → [[work-items/WML-203|WML-203]]
- `refines` → [[scr-rows/WML-C-17|WML-C-17]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-UNKNOWN-CONTENT-PRESERVED|WML-FX-UNKNOWN-CONTENT-PRESERVED]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-17"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "12.4",
    "heading": "12.4 Unknown DTD",
    "normalizedTextSha256": "9baf0c88a816840e176f22ed82307041e281a99499bc4479b16410c26ab99a44"
  },
  "normativeForce": "explicit-should",
  "obligationLevel": "recommended",
  "obligationSynopsis": "Continue rendering recognized content nested inside an unrecognized element.",
  "workItems": [
    "R0-01",
    "R0-07",
    "WML-201",
    "WML-203",
    "WML-306"
  ],
  "ownerLayers": [
    "browser",
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-RMK-009"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
