---
id: "clause:WML-CL-CARD-ID-FRAGMENT"
key: "WML-CL-CARD-ID-FRAGMENT"
type: "clause"
generated: true
slice: "WML-3"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Use a card id as its fragment-navigation anchor.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-001|RQ-RMK-001]]
- `maps-to` → [[requirements/RQ-RMK-003|RQ-RMK-003]]
- `planned-by` → [[work-items/WML-301|WML-301]]
- `refines` → [[scr-rows/WML-C-18|WML-C-18]]
- `refines` → [[scr-rows/WML-C-25|WML-C-25]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-CARD-ID-FRAGMENT|WML-FX-CARD-ID-FRAGMENT]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-25",
    "WML-C-18"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "11.5.2",
    "heading": "11.5.2 The Card Element",
    "normalizedTextSha256": "f36c9181109d42ff77b92fd520fb3bcffc5b909d10f9eb4e1fd9cf43e7ffeca5"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Use a card id as its fragment-navigation anchor.",
  "workItems": [
    "C5-03",
    "R0-01",
    "R0-02",
    "R0-04",
    "WML-201",
    "WML-301"
  ],
  "ownerLayers": [
    "browser",
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-RMK-001",
    "RQ-RMK-003"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
