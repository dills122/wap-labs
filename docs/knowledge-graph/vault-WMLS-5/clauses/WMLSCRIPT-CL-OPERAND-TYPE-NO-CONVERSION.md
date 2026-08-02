---
id: "clause:WMLSCRIPT-CL-OPERAND-TYPE-NO-CONVERSION"
key: "WMLSCRIPT-CL-OPERAND-TYPE-NO-CONVERSION"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Inspect the evaluated operand type without performing an automatic data conversion.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-008|RQ-WMLS-008]]
- `planned-by` → [[work-items/WMLS-501|WMLS-501]]
- `planned-by` → [[work-items/WMLS-502|WMLS-502]]
- `refines` → [[scr-rows/WMLS-C-104|WMLS-C-104]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-OPERAND-TYPE-NO-CONVERSION|WMLSCRIPT-FX-OPERAND-TYPE-NO-CONVERSION]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-104"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "10.5.10",
    "heading": "10.5.10 Access to Operand Type",
    "normalizedTextSha256": "4171534f964ecfb552b5667a8fb813e67926f3c40711f1cd81fa4fcc35b54cae"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Inspect the evaluated operand type without performing an automatic data conversion.",
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
    "RQ-WMLS-008"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
