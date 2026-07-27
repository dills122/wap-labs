---
id: "clause:WMLSCRIPT-CL-FUNCTION-CALL-INDEX-TYPES"
key: "WMLSCRIPT-CL-FUNCTION-CALL-INDEX-TYPES"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Validate local, library, URL, and function-name indexes against the required pool and constant type before invoking a call.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-008|RQ-WMLS-008]]
- `maps-to` → [[requirements/RQ-WMLS-009|RQ-WMLS-009]]
- `planned-by` → [[work-items/WMLS-501|WMLS-501]]
- `refines` → [[scr-rows/WMLS-C-096|WMLS-C-096]]
- `refines` → [[scr-rows/WMLS-C-108|WMLS-C-108]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-FUNCTION-CALL-INDEX-TYPES|WMLSCRIPT-FX-FUNCTION-CALL-INDEX-TYPES]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-096",
    "WMLS-C-108"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "10.5.2",
    "heading": "10.5.2 Function Call Instructions",
    "normalizedTextSha256": "8ddbc95be16b4f4c6961a4d7724ee42616814b2c6f91cf77fa2576819b37c0d3"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Validate local, library, URL, and function-name indexes against the required pool and constant type before invoking a call.",
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
