---
id: "clause:WMLSCRIPT-CL-URL-SCHEME-SUPPORT"
key: "WMLSCRIPT-CL-URL-SCHEME-SUPPORT"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Support the URL schemes required by the selected WAE profile.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-001|RQ-WMLS-001]]
- `maps-to` → [[requirements/RQ-WMLS-003|RQ-WMLS-003]]
- `planned-by` → [[work-items/WMLS-503|WMLS-503]]
- `refines` → [[scr-rows/WMLS-C-078|WMLS-C-078]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-URL-SCHEME-SUPPORT|WMLSCRIPT-FX-URL-SCHEME-SUPPORT]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-078"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "8.3.1",
    "heading": "8.3.1 URL Schemes",
    "normalizedTextSha256": "76bbd826dd33022a104900f734208a9c02df440f8415746f6d55fed4b2c6a99f"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Support the URL schemes required by the selected WAE profile.",
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
