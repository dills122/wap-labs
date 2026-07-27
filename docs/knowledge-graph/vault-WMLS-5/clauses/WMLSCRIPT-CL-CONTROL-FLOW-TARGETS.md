---
id: "clause:WMLSCRIPT-CL-CONTROL-FLOW-TARGETS"
key: "WMLSCRIPT-CL-CONTROL-FLOW-TARGETS"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Resolve forward and backward jump offsets from the current instruction and execute only verified in-function instruction targets.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-008|RQ-WMLS-008]]
- `maps-to` → [[requirements/RQ-WMLS-009|RQ-WMLS-009]]
- `planned-by` → [[work-items/WMLS-501|WMLS-501]]
- `refines` → [[scr-rows/WMLS-C-095|WMLS-C-095]]
- `refines` → [[scr-rows/WMLS-C-108|WMLS-C-108]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-CONTROL-FLOW-TARGETS|WMLSCRIPT-FX-CONTROL-FLOW-TARGETS]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-095",
    "WMLS-C-108"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "10.5.1",
    "heading": "10.5.1 Control Flow Instructions",
    "normalizedTextSha256": "7cecccba10097a530fa7164552d0a8357cf2e6e3d2dce3312af917bdf937d529"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Resolve forward and backward jump offsets from the current instruction and execute only verified in-function instruction targets.",
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
