---
id: "clause:WMLSCRIPT-CL-INTEGRITY-FAILURE-QUARANTINE"
key: "WMLSCRIPT-CL-INTEGRITY-FAILURE-QUARANTINE"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Do not execute failed bytecode; abort any started execution and signal verification failure to the interpreter caller.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-009|RQ-WMLS-009]]
- `maps-to` → [[requirements/RQ-WMLS-010|RQ-WMLS-010]]
- `planned-by` → [[work-items/WMLS-501|WMLS-501]]
- `planned-by` → [[work-items/WMLS-505|WMLS-505]]
- `refines` → [[scr-rows/WMLS-C-107|WMLS-C-107]]
- `refines` → [[scr-rows/WMLS-C-110|WMLS-C-110]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-INTEGRITY-FAILURE-QUARANTINE|WMLSCRIPT-FX-INTEGRITY-FAILURE-QUARANTINE]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-107",
    "WMLS-C-110"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "11.1",
    "heading": "11.1 Integrity Check",
    "normalizedTextSha256": "04be2a2212f6162331b899c1bb035faec5f68ddd7f12c7f45f722eb70cc529e9"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Do not execute failed bytecode; abort any started execution and signal verification failure to the interpreter caller.",
  "workItems": [
    "W1-02",
    "W1-06",
    "W1-07",
    "WMLS-501",
    "WMLS-505"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-009",
    "RQ-WMLS-010"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
