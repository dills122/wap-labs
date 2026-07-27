---
id: "clause:WMLSCRIPT-CL-URL-CALL-GRAMMAR"
key: "WMLSCRIPT-CL-URL-CALL-GRAMMAR"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Parse URL-call fragments as a function name followed by parentheses containing zero or more comma-separated literal arguments.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-001|RQ-WMLS-001]]
- `maps-to` → [[requirements/RQ-WMLS-003|RQ-WMLS-003]]
- `planned-by` → [[work-items/WMLS-503|WMLS-503]]
- `refines` → [[scr-rows/WMLS-C-080|WMLS-C-080]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-URL-CALL-GRAMMAR|WMLSCRIPT-FX-URL-CALL-GRAMMAR]]

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
  "normativeForce": "grammar",
  "obligationLevel": "required",
  "obligationSynopsis": "Parse URL-call fragments as a function name followed by parentheses containing zero or more comma-separated literal arguments.",
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
