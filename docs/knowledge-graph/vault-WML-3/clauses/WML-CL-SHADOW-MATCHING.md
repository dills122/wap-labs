---
id: "clause:WML-CL-SHADOW-MATCHING"
key: "WML-CL-SHADOW-MATCHING"
type: "clause"
generated: true
slice: "WML-3"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Match card and template onevent bindings by event type and do bindings by effective name for shadowing.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-001|RQ-RMK-001]]
- `maps-to` → [[requirements/RQ-RMK-002|RQ-RMK-002]]
- `planned-by` → [[work-items/WML-303|WML-303]]
- `refines` → [[scr-rows/WML-C-08|WML-C-08]]
- `refines` → [[scr-rows/WML-C-47|WML-C-47]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-SHADOW-MATCHING|WML-FX-SHADOW-MATCHING]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-08",
    "WML-C-47"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "9.6",
    "heading": "9.6 Card/Deck Task Shadowing",
    "normalizedTextSha256": "27f2d6fb18754c82a1deacf349d2c50cf71ca5e70f4e12c73a0775f850e9da4d"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Match card and template onevent bindings by event type and do bindings by effective name for shadowing.",
  "workItems": [
    "R0-01",
    "R0-02",
    "R0-04",
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
    "RQ-RMK-001",
    "RQ-RMK-002"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
