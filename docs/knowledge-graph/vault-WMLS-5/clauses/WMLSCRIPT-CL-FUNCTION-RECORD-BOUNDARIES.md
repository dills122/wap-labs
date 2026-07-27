---
id: "clause:WMLSCRIPT-CL-FUNCTION-RECORD-BOUNDARIES"
key: "WMLSCRIPT-CL-FUNCTION-RECORD-BOUNDARIES"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Decode each function argument count, local count, code size, and instruction bytes without crossing its declared boundary.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-008|RQ-WMLS-008]]
- `maps-to` → [[requirements/RQ-WMLS-009|RQ-WMLS-009]]
- `planned-by` → [[work-items/WMLS-501|WMLS-501]]
- `refines` → [[scr-rows/WMLS-C-094|WMLS-C-094]]
- `refines` → [[scr-rows/WMLS-C-107|WMLS-C-107]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-FUNCTION-RECORD-BOUNDARIES|WMLSCRIPT-FX-FUNCTION-RECORD-BOUNDARIES]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-094",
    "WMLS-C-107"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "9.6",
    "heading": "9.6 Function Pool",
    "normalizedTextSha256": "caaaa75bad7b3f73f949f9b44447e425304aab37a00e81a42c621638f21db10e"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Decode each function argument count, local count, code size, and instruction bytes without crossing its declared boundary.",
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
