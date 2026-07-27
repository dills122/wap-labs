---
id: "clause:WMLSCRIPT-LIBRARIES-CL-URL-IS-VALID-BEHAVIOR"
key: "WMLSCRIPT-LIBRARIES-CL-URL-IS-VALID-BEHAVIOR"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Validate absolute or relative RFC 2396 syntax without resolving a relative reference, returning true only for valid syntax.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-016|RQ-WMLS-016]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `refines` → [[scr-rows/WMLSSL-071|WMLSSL-071]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-URL-IS-VALID-BEHAVIOR|WMLSCRIPT-LIBRARIES-FX-URL-IS-VALID-BEHAVIOR]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-071"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "10.1",
    "heading": "10.1 isValid",
    "normalizedTextSha256": "9550ccfb8a2e81ba4e19f4af9a74ad806bde3792cb92062248b0a43f77a33b7a"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Validate absolute or relative RFC 2396 syntax without resolving a relative reference, returning true only for valid syntax.",
  "workItems": [
    "W1-05",
    "WMLS-504"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-016"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
