---
id: "clause:WMLSCRIPT-CL-URL-CALL-LITERAL-ONLY"
key: "WMLSCRIPT-CL-URL-CALL-LITERAL-ONLY"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Reject expressions and nested function calls in URL-call argument lists; accept only the defined invalid, boolean, numeric, and string literals.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-001|RQ-WMLS-001]]
- `maps-to` → [[requirements/RQ-WMLS-003|RQ-WMLS-003]]
- `planned-by` → [[work-items/WMLS-503|WMLS-503]]
- `refines` → [[scr-rows/WMLS-C-080|WMLS-C-080]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-URL-CALL-LITERAL-ONLY|WMLSCRIPT-FX-URL-CALL-LITERAL-ONLY]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-080"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "8.3.3",
    "heading": "8.3.3 URL Call Syntax",
    "normalizedTextSha256": "576e6d25d17be7454808f2abb29d0606a9ab68327a0ed4545323368295d9c58e"
  },
  "normativeForce": "error-condition",
  "obligationLevel": "required",
  "obligationSynopsis": "Reject expressions and nested function calls in URL-call argument lists; accept only the defined invalid, boolean, numeric, and string literals.",
  "workItems": [
    "W0-08",
    "W1-03",
    "WMLS-503"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-001",
    "RQ-WMLS-003"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
