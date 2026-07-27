---
id: "clause:WMLSCRIPT-CL-ACCESS-DENIAL-ERROR"
key: "WMLSCRIPT-CL-ACCESS-DENIAL-ERROR"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Reject a protected compilation-unit call as an access violation without executing the target function.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-001|RQ-WMLS-001]]
- `maps-to` → [[requirements/RQ-WMLS-002|RQ-WMLS-002]]
- `planned-by` → [[work-items/WMLS-503|WMLS-503]]
- `refines` → [[scr-rows/WMLS-C-087|WMLS-C-087]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-ACCESS-DENIAL-ERROR|WMLSCRIPT-FX-ACCESS-DENIAL-ERROR]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-087"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "8.5",
    "heading": "8.5 Access Control",
    "normalizedTextSha256": "fd16820140cbfabb16ab004013091dd0a04ca9aa1a8ae236cb6929d5344c18d2"
  },
  "normativeForce": "error-condition",
  "obligationLevel": "required",
  "obligationSynopsis": "Reject a protected compilation-unit call as an access violation without executing the target function.",
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
    "RQ-WMLS-002"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
