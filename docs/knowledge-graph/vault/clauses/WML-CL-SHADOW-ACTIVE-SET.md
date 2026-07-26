---
id: "clause:WML-CL-SHADOW-ACTIVE-SET"
key: "WML-CL-SHADOW-ACTIVE-SET"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Build the active event set from non-noop card bindings plus unshadowed non-noop template bindings.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-002|RQ-RMK-002]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `planned-by` → [[work-items/WML-202|WML-202]]
- `refines` → [[scr-rows/WML-C-08|WML-C-08]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-SHADOW-ACTIVE-SET|WML-FX-SHADOW-ACTIVE-SET]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-08"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "9.6",
    "heading": "9.6 Card/Deck Task Shadowing",
    "normalizedTextSha256": "27f2d6fb18754c82a1deacf349d2c50cf71ca5e70f4e12c73a0775f850e9da4d"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Build the active event set from non-noop card bindings plus unshadowed non-noop template bindings.",
  "workItems": [
    "R0-01",
    "R0-02",
    "R0-12",
    "WML-201",
    "WML-202",
    "WML-303"
  ],
  "ownerLayers": [
    "browser",
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-RMK-002"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
