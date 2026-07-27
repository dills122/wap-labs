---
id: "clause:WMLSCRIPT-CL-STANDARD-LIBRARY-BOUNDARY"
key: "WMLSCRIPT-CL-STANDARD-LIBRARY-BOUNDARY"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Expose every required WMLScript standard library through the interpreter call boundary defined by the separate selected library ledger.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-012|RQ-WMLS-012]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `refines` → [[scr-rows/WMLS-C-070|WMLS-C-070]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-STANDARD-LIBRARY-BOUNDARY|WMLSCRIPT-FX-STANDARD-LIBRARY-BOUNDARY]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-070"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "6.6.1",
    "heading": "6.6.1 Standard Libraries",
    "normalizedTextSha256": "b47f1e59498805cdce4587e1279497a447d495293f1635e4266781ba1c1f9f1f"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Expose every required WMLScript standard library through the interpreter call boundary defined by the separate selected library ledger.",
  "workItems": [
    "W1-05",
    "WMLS-504"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-012"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
