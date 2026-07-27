---
id: "clause:WMLSCRIPT-CL-CONVERSION-INTEGER-STRING-GRAMMAR"
key: "WMLSCRIPT-CL-CONVERSION-INTEGER-STRING-GRAMMAR"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Convert a string to integer only when the entire string is a valid decimal integer representation.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-006|RQ-WMLS-006]]
- `maps-to` → [[requirements/RQ-WMLS-007|RQ-WMLS-007]]
- `planned-by` → [[work-items/WMLS-502|WMLS-502]]
- `refines` → [[scr-rows/WMLS-C-073|WMLS-C-073]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-CONVERSION-INTEGER-STRING-GRAMMAR|WMLSCRIPT-FX-CONVERSION-INTEGER-STRING-GRAMMAR]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-073"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "6.8.3",
    "heading": "6.8.3 Conversions to Integer",
    "normalizedTextSha256": "d27d9db7028067f9be9a59f4f23e48a54162ff0ea467acf08badf575fc05c7c3"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Convert a string to integer only when the entire string is a valid decimal integer representation.",
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
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
