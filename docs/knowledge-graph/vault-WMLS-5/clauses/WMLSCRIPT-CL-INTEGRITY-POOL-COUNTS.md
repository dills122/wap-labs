---
id: "clause:WMLSCRIPT-CL-INTEGRITY-POOL-COUNTS"
key: "WMLSCRIPT-CL-INTEGRITY-POOL-COUNTS"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Require constant, pragma, function-name, and function counts to match the records encoded in their pools.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-008|RQ-WMLS-008]]
- `maps-to` → [[requirements/RQ-WMLS-009|RQ-WMLS-009]]
- `planned-by` → [[work-items/WMLS-501|WMLS-501]]
- `planned-by` → [[work-items/WMLS-502|WMLS-502]]
- `planned-by` → [[work-items/WMLS-503|WMLS-503]]
- `refines` → [[scr-rows/WMLS-C-092|WMLS-C-092]]
- `refines` → [[scr-rows/WMLS-C-093|WMLS-C-093]]
- `refines` → [[scr-rows/WMLS-C-094|WMLS-C-094]]
- `refines` → [[scr-rows/WMLS-C-107|WMLS-C-107]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-INTEGRITY-POOL-COUNTS|WMLSCRIPT-FX-INTEGRITY-POOL-COUNTS]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-092",
    "WMLS-C-093",
    "WMLS-C-094",
    "WMLS-C-107"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "11.1",
    "heading": "11.1 Integrity Check",
    "normalizedTextSha256": "04be2a2212f6162331b899c1bb035faec5f68ddd7f12c7f45f722eb70cc529e9"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Require constant, pragma, function-name, and function counts to match the records encoded in their pools.",
  "workItems": [
    "W1-02",
    "W1-03",
    "W1-04",
    "W1-05",
    "WMLS-501",
    "WMLS-502",
    "WMLS-503"
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
