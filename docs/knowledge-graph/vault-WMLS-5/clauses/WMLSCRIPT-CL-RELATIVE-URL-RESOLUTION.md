---
id: "clause:WMLSCRIPT-CL-RELATIVE-URL-RESOLUTION"
key: "WMLSCRIPT-CL-RELATIVE-URL-RESOLUTION"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Resolve relative compilation-unit URLs using RFC 2396 rules and the current compilation-unit URL as base.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-001|RQ-WMLS-001]]
- `maps-to` → [[requirements/RQ-WMLS-003|RQ-WMLS-003]]
- `planned-by` → [[work-items/WMLS-503|WMLS-503]]
- `refines` → [[scr-rows/WMLS-C-082|WMLS-C-082]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-RELATIVE-URL-RESOLUTION|WMLSCRIPT-FX-RELATIVE-URL-RESOLUTION]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-082"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "8.3.6",
    "heading": "8.3.6 Relative URLs",
    "normalizedTextSha256": "2066f81c220524db34fcef5e08a8b5a47f4b4c5a9234a830200373cfc1e4c344"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Resolve relative compilation-unit URLs using RFC 2396 rules and the current compilation-unit URL as base.",
  "workItems": [
    "W0-08",
    "W1-03",
    "WMLS-503"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-001",
    "RQ-WMLS-003"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
