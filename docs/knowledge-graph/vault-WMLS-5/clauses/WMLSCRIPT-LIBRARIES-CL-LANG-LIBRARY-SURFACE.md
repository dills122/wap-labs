---
id: "clause:WMLSCRIPT-LIBRARIES-CL-LANG-LIBRARY-SURFACE"
key: "WMLSCRIPT-LIBRARIES-CL-LANG-LIBRARY-SURFACE"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Expose the complete lang standard-library namespace and its selected functions through the WMLScript library-call boundary.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-013|RQ-WMLS-013]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `refines` → [[scr-rows/WMLSSL-018|WMLSSL-018]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-LANG-LIBRARY-SURFACE|WMLSCRIPT-LIBRARIES-FX-LANG-LIBRARY-SURFACE]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-018"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "7",
    "heading": "7.      LANG",
    "normalizedTextSha256": "606d867106551fa14a89992ddb5f2d9564c5b06458c2f0ab4ae2894b963920c0"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Expose the complete lang standard-library namespace and its selected functions through the WMLScript library-call boundary.",
  "workItems": [
    "W1-05",
    "WMLS-504"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-013"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
