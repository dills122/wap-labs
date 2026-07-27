---
id: "clause:WML-CL-ACCESS-DEFAULTS"
key: "WML-CL-ACCESS-DEFAULTS"
type: "clause"
generated: true
slice: "WML-3"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Default an omitted access domain to the current deck domain and an omitted path to slash.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-001|RQ-RMK-001]]
- `planned-by` → [[work-items/WML-306|WML-306]]
- `refines` → [[scr-rows/WML-C-21|WML-C-21]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-ACCESS-DEFAULTS|WML-FX-ACCESS-DEFAULTS]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-21"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "11.3.1",
    "heading": "11.3.1 The Access Element",
    "normalizedTextSha256": "105b4b3e7a77eec253ac220a6f9584aa6043bcf51e5298f6bb1bd4dedb7b8174"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Default an omitted access domain to the current deck domain and an omitted path to slash.",
  "workItems": [
    "C5-03",
    "R0-01",
    "R0-04",
    "WML-201",
    "WML-202",
    "WML-306"
  ],
  "ownerLayers": [
    "browser",
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
