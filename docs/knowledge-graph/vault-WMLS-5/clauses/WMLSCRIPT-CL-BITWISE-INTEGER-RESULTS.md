---
id: "clause:WMLSCRIPT-CL-BITWISE-INTEGER-RESULTS"
key: "WMLSCRIPT-CL-BITWISE-INTEGER-RESULTS"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Convert bitwise operands to integers and return invalid when an integer conversion is illegal.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-006|RQ-WMLS-006]]
- `maps-to` → [[requirements/RQ-WMLS-007|RQ-WMLS-007]]
- `maps-to` → [[requirements/RQ-WMLS-008|RQ-WMLS-008]]
- `planned-by` → [[work-items/WMLS-501|WMLS-501]]
- `planned-by` → [[work-items/WMLS-502|WMLS-502]]
- `refines` → [[scr-rows/WMLS-C-077|WMLS-C-077]]
- `refines` → [[scr-rows/WMLS-C-100|WMLS-C-100]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-BITWISE-INTEGER-RESULTS|WMLSCRIPT-FX-BITWISE-INTEGER-RESULTS]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-077",
    "WMLS-C-100"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "10.5.6",
    "heading": "10.5.6 Bitwise Instructions",
    "normalizedTextSha256": "2f6d36f5429c208883ae31f495e72edb623a6dc84f04170e17e7a870262370d3"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Convert bitwise operands to integers and return invalid when an integer conversion is illegal.",
  "workItems": [
    "W1-02",
    "W1-04",
    "W1-05",
    "WMLS-501",
    "WMLS-502"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-006",
    "RQ-WMLS-007",
    "RQ-WMLS-008"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
