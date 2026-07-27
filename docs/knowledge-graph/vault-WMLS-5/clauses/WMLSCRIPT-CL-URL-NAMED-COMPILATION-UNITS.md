---
id: "clause:WMLSCRIPT-CL-URL-NAMED-COMPILATION-UNITS"
key: "WMLSCRIPT-CL-URL-NAMED-COMPILATION-UNITS"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Name and fetch WMLScript compilation units by URL using a protocol with HTTP semantics.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-001|RQ-WMLS-001]]
- `maps-to` → [[requirements/RQ-WMLS-003|RQ-WMLS-003]]
- `planned-by` → [[work-items/WMLS-503|WMLS-503]]
- `refines` → [[scr-rows/WMLS-C-078|WMLS-C-078]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-URL-NAMED-COMPILATION-UNITS|WMLSCRIPT-FX-URL-NAMED-COMPILATION-UNITS]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-078"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "8.3",
    "heading": "8.3 WMLScript and URLs",
    "normalizedTextSha256": "bfb3b5ce76fc170d2542abd0c3cb1d8b4e3bac412f5fd1a6729b8c0e167b1294"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Name and fetch WMLScript compilation units by URL using a protocol with HTTP semantics.",
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
