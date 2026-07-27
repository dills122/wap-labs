---
id: "clause:WMLSCRIPT-CL-BYTECODE-COMPILATION-UNIT"
key: "WMLSCRIPT-CL-BYTECODE-COMPILATION-UNIT"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Accept compiled WMLScript compilation units in the effective chapter 9 binary format rather than treating source text or project bytecode as WAP bytecode.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-008|RQ-WMLS-008]]
- `planned-by` → [[work-items/WMLS-501|WMLS-501]]
- `refines` → [[scr-rows/WMLS-C-069|WMLS-C-069]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-BYTECODE-COMPILATION-UNIT|WMLSCRIPT-FX-BYTECODE-COMPILATION-UNIT]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-069"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "8",
    "heading": "8. WMLSCRIPT BYTECODE INTERPRETER",
    "normalizedTextSha256": "e41d0a68d1d225e6ab643b65624b81412462b5fc0f6f4b6b945c840d57866838"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Accept compiled WMLScript compilation units in the effective chapter 9 binary format rather than treating source text or project bytecode as WAP bytecode.",
  "workItems": [
    "W1-05",
    "WMLS-501"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-008"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
