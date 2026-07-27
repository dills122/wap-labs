---
id: "clause:WMLSCRIPT-CL-URL-CALL-UNESCAPE-BEFORE-PARSE"
key: "WMLSCRIPT-CL-URL-CALL-UNESCAPE-BEFORE-PARSE"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Apply URL and containing-content unescaping before parsing the URL-call fragment grammar.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-001|RQ-WMLS-001]]
- `maps-to` → [[requirements/RQ-WMLS-003|RQ-WMLS-003]]
- `planned-by` → [[work-items/WMLS-503|WMLS-503]]
- `refines` → [[scr-rows/WMLS-C-080|WMLS-C-080]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-URL-CALL-UNESCAPE-BEFORE-PARSE|WMLSCRIPT-FX-URL-CALL-UNESCAPE-BEFORE-PARSE]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-080"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "8.3.5",
    "heading": "8.3.5 Character Escaping",
    "normalizedTextSha256": "1f45654652417e774096d2098b2331ebd597b71bf973c865a79569824a294f39"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Apply URL and containing-content unescaping before parsing the URL-call fragment grammar.",
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
