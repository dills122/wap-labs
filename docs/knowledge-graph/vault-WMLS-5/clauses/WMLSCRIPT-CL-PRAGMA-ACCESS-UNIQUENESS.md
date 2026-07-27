---
id: "clause:WMLSCRIPT-CL-PRAGMA-ACCESS-UNIQUENESS"
key: "WMLSCRIPT-CL-PRAGMA-ACCESS-UNIQUENESS"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Allow at most one access-domain and one access-path pragma in a compilation unit.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-001|RQ-WMLS-001]]
- `maps-to` → [[requirements/RQ-WMLS-002|RQ-WMLS-002]]
- `maps-to` → [[requirements/RQ-WMLS-008|RQ-WMLS-008]]
- `planned-by` → [[work-items/WMLS-501|WMLS-501]]
- `planned-by` → [[work-items/WMLS-503|WMLS-503]]
- `refines` → [[scr-rows/WMLS-C-087|WMLS-C-087]]
- `refines` → [[scr-rows/WMLS-C-093|WMLS-C-093]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-PRAGMA-ACCESS-UNIQUENESS|WMLSCRIPT-FX-PRAGMA-ACCESS-UNIQUENESS]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-087",
    "WMLS-C-093"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "9.5",
    "heading": "9.5   Pragma Pool",
    "normalizedTextSha256": "a6bac4dfaba7ef0d453bdd296ca93c77d2ef22deb6df68909b2712a17d317fa1"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Allow at most one access-domain and one access-path pragma in a compilation unit.",
  "workItems": [
    "W0-08",
    "W1-02",
    "W1-03",
    "WMLS-501",
    "WMLS-503"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-001",
    "RQ-WMLS-002",
    "RQ-WMLS-008"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
