---
id: "clause:WMLSCRIPT-CL-RUNTIME-STACK-VALIDITY"
key: "WMLSCRIPT-CL-RUNTIME-STACK-VALIDITY"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Check operand availability for each instruction before applying its stack effect.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-008|RQ-WMLS-008]]
- `maps-to` → [[requirements/RQ-WMLS-009|RQ-WMLS-009]]
- `planned-by` → [[work-items/WMLS-501|WMLS-501]]
- `refines` → [[scr-rows/WMLS-C-095|WMLS-C-095]]
- `refines` → [[scr-rows/WMLS-C-096|WMLS-C-096]]
- `refines` → [[scr-rows/WMLS-C-097|WMLS-C-097]]
- `refines` → [[scr-rows/WMLS-C-099|WMLS-C-099]]
- `refines` → [[scr-rows/WMLS-C-100|WMLS-C-100]]
- `refines` → [[scr-rows/WMLS-C-101|WMLS-C-101]]
- `refines` → [[scr-rows/WMLS-C-102|WMLS-C-102]]
- `refines` → [[scr-rows/WMLS-C-103|WMLS-C-103]]
- `refines` → [[scr-rows/WMLS-C-104|WMLS-C-104]]
- `refines` → [[scr-rows/WMLS-C-105|WMLS-C-105]]
- `refines` → [[scr-rows/WMLS-C-108|WMLS-C-108]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-RUNTIME-STACK-VALIDITY|WMLSCRIPT-FX-RUNTIME-STACK-VALIDITY]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-095",
    "WMLS-C-096",
    "WMLS-C-097",
    "WMLS-C-099",
    "WMLS-C-100",
    "WMLS-C-101",
    "WMLS-C-102",
    "WMLS-C-103",
    "WMLS-C-104",
    "WMLS-C-105",
    "WMLS-C-108"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "11.2",
    "heading": "11.2 Runtime Validity Checks",
    "normalizedTextSha256": "f5de953bec54094e63a7f6f412e5e0598d8946b72a21bd07275a57e168ce1405"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Check operand availability for each instruction before applying its stack effect.",
  "workItems": [
    "W1-02",
    "WMLS-501"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-008",
    "RQ-WMLS-009"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
