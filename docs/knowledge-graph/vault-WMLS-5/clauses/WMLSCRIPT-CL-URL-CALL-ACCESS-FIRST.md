---
id: "clause:WMLSCRIPT-CL-URL-CALL-ACCESS-FIRST"
key: "WMLSCRIPT-CL-URL-CALL-ACCESS-FIRST"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Perform compilation-unit access control before matching or invoking the requested external function.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-001|RQ-WMLS-001]]
- `maps-to` → [[requirements/RQ-WMLS-002|RQ-WMLS-002]]
- `maps-to` → [[requirements/RQ-WMLS-003|RQ-WMLS-003]]
- `planned-by` → [[work-items/WMLS-503|WMLS-503]]
- `refines` → [[scr-rows/WMLS-C-081|WMLS-C-081]]
- `refines` → [[scr-rows/WMLS-C-087|WMLS-C-087]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-URL-CALL-ACCESS-FIRST|WMLSCRIPT-FX-URL-CALL-ACCESS-FIRST]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-081",
    "WMLS-C-087"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "8.3.4",
    "heading": "8.3.4 URL Calls and Parameter Passing",
    "normalizedTextSha256": "6d2e14a76064f1d2b6defd59ab4681d329dd8d2468a8c36cb166d2711c38fcde"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Perform compilation-unit access control before matching or invoking the requested external function.",
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
    "RQ-WMLS-002",
    "RQ-WMLS-003"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
