---
id: "clause:WML-CL-CARD-TABLE-BOUNDARIES"
key: "WML-CL-CARD-TABLE-BOUNDARIES"
type: "clause"
generated: true
slice: "WML-3"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Insert table boundary line breaks unless the table is respectively the first or last significant card content.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-001|RQ-RMK-001]]
- `planned-by` → [[work-items/WML-301|WML-301]]
- `refines` → [[scr-rows/WML-C-25|WML-C-25]]
- `refines` → [[scr-rows/WML-C-46|WML-C-46]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-CARD-TABLE-BOUNDARIES|WML-FX-CARD-TABLE-BOUNDARIES]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-25",
    "WML-C-46"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "11.5.2",
    "heading": "11.5.2 The Card Element",
    "normalizedTextSha256": "f36c9181109d42ff77b92fd520fb3bcffc5b909d10f9eb4e1fd9cf43e7ffeca5"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Insert table boundary line breaks unless the table is respectively the first or last significant card content.",
  "workItems": [
    "C5-03",
    "R0-01",
    "R0-04",
    "R0-05",
    "WML-201",
    "WML-301"
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
