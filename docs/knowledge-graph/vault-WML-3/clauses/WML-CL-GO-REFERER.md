---
id: "clause:WML-CL-GO-REFERER"
key: "WML-CL-GO-REFERER"
type: "clause"
generated: true
slice: "WML-3"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# When sendreferer is true, transmit the smallest usable relative URI for the referring deck.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-002|RQ-RMK-002]]
- `maps-to` → [[requirements/RQ-RMK-011|RQ-RMK-011]]
- `planned-by` → [[work-items/WML-304|WML-304]]
- `refines` → [[scr-rows/WML-C-14|WML-C-14]]
- `refines` → [[scr-rows/WML-C-29|WML-C-29]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-GO-REFERER|WML-FX-GO-REFERER]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-14",
    "WML-C-29"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "9.5.1",
    "heading": "9.5.1 The Go Element",
    "normalizedTextSha256": "90342941a32689afb2592233c1c1b0fd9f613ff59ef884eebbce0c792feedc12"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "When sendreferer is true, transmit the smallest usable relative URI for the referring deck.",
  "workItems": [
    "R0-01",
    "R0-02",
    "R0-06",
    "R0-07",
    "WML-201",
    "WML-304",
    "WSP-805"
  ],
  "ownerLayers": [
    "browser",
    "engine-wasm",
    "transport-rust"
  ],
  "requirementIds": [
    "RQ-RMK-002",
    "RQ-RMK-011"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
