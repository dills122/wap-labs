---
id: "clause:WMLSCRIPT-CL-CONVERSION-INVALID-PROPAGATION"
key: "WMLSCRIPT-CL-CONVERSION-INVALID-PROPAGATION"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Propagate invalid through operators except where the operator definition explicitly provides different invalid behavior.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-006|RQ-WMLS-006]]
- `maps-to` → [[requirements/RQ-WMLS-007|RQ-WMLS-007]]
- `planned-by` → [[work-items/WMLS-502|WMLS-502]]
- `refines` → [[scr-rows/WMLS-C-076|WMLS-C-076]]
- `refines` → [[scr-rows/WMLS-C-077|WMLS-C-077]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-CONVERSION-INVALID-PROPAGATION|WMLSCRIPT-FX-CONVERSION-INVALID-PROPAGATION]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-076",
    "WMLS-C-077"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "6.8.6",
    "heading": "6.8.6 Conversions to Invalid",
    "normalizedTextSha256": "7032afa845c408b2a23b5b8df54370932675e2238c79089c58e221444af249c6"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Propagate invalid through operators except where the operator definition explicitly provides different invalid behavior.",
  "workItems": [
    "W1-04",
    "WMLS-502"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-006",
    "RQ-WMLS-007"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
