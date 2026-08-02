---
id: "clause:WMLSCRIPT-CL-CONVERSION-SUMMARY-MATRIX"
key: "WMLSCRIPT-CL-CONVERSION-SUMMARY-MATRIX"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Implement the complete effective automatic-conversion matrix for Boolean, Integer, Floating-point, String, and Invalid source values.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-006|RQ-WMLS-006]]
- `maps-to` → [[requirements/RQ-WMLS-007|RQ-WMLS-007]]
- `planned-by` → [[work-items/WMLS-502|WMLS-502]]
- `refines` → [[scr-rows/WMLS-C-072|WMLS-C-072]]
- `refines` → [[scr-rows/WMLS-C-073|WMLS-C-073]]
- `refines` → [[scr-rows/WMLS-C-075|WMLS-C-075]]
- `refines` → [[scr-rows/WMLS-C-076|WMLS-C-076]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-CONVERSION-SUMMARY-MATRIX|WMLSCRIPT-FX-CONVERSION-SUMMARY-MATRIX]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-072",
    "WMLS-C-073",
    "WMLS-C-075",
    "WMLS-C-076"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "6.8.7",
    "heading": "6.8.7 Summary",
    "normalizedTextSha256": "d13577ae37a5acd796ab07d92c687213960ba377ebb4188faa811c31a7b6c910"
  },
  "normativeForce": "table",
  "obligationLevel": "required",
  "obligationSynopsis": "Implement the complete effective automatic-conversion matrix for Boolean, Integer, Floating-point, String, and Invalid source values.",
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
