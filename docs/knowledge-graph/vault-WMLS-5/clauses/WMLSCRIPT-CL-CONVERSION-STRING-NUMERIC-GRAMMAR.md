---
id: "clause:WMLSCRIPT-CL-CONVERSION-STRING-NUMERIC-GRAMMAR"
key: "WMLSCRIPT-CL-CONVERSION-STRING-NUMERIC-GRAMMAR"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Produce numeric strings that satisfy the decimal numeric-string grammar and preserve the represented numeric value.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-006|RQ-WMLS-006]]
- `maps-to` → [[requirements/RQ-WMLS-007|RQ-WMLS-007]]
- `planned-by` → [[work-items/WMLS-502|WMLS-502]]
- `refines` → [[scr-rows/WMLS-C-072|WMLS-C-072]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-CONVERSION-STRING-NUMERIC-GRAMMAR|WMLSCRIPT-FX-CONVERSION-STRING-NUMERIC-GRAMMAR]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-072"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "6.8.2",
    "heading": "6.8.2 Conversions to String",
    "normalizedTextSha256": "7811970bb6c21936d7ee57ad6e5af546b69ec3560b223745038c91afaa5f0a9c"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Produce numeric strings that satisfy the decimal numeric-string grammar and preserve the represented numeric value.",
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
