---
id: "clause:WMLSCRIPT-CL-FRAGMENT-FUNCTION-IDENTITY"
key: "WMLSCRIPT-CL-FRAGMENT-FUNCTION-IDENTITY"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Resolve a URL fragment identifier as the external function name within the referenced WMLScript compilation unit.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-001|RQ-WMLS-001]]
- `maps-to` → [[requirements/RQ-WMLS-003|RQ-WMLS-003]]
- `planned-by` → [[work-items/WMLS-503|WMLS-503]]
- `refines` → [[scr-rows/WMLS-C-079|WMLS-C-079]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-FRAGMENT-FUNCTION-IDENTITY|WMLSCRIPT-FX-FRAGMENT-FUNCTION-IDENTITY]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-079"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "8.3.2",
    "heading": "8.3.2 Fragment Anchors",
    "normalizedTextSha256": "cdeec61f85895134ddf71f2cdcc08e3b2d4032dc0bd4673136a461e9491a4a04"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Resolve a URL fragment identifier as the external function name within the referenced WMLScript compilation unit.",
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
