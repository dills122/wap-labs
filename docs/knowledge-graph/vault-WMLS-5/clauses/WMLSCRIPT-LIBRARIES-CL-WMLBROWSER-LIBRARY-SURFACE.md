---
id: "clause:WMLSCRIPT-LIBRARIES-CL-WMLBROWSER-LIBRARY-SURFACE"
key: "WMLSCRIPT-LIBRARIES-CL-WMLBROWSER-LIBRARY-SURFACE"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Expose the complete wmlbrowser standard-library namespace and its selected functions through the WMLScript library-call boundary.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-017|RQ-WMLS-017]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `refines` → [[scr-rows/WMLSSL-022|WMLSSL-022]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-WMLBROWSER-LIBRARY-SURFACE|WMLSCRIPT-LIBRARIES-FX-WMLBROWSER-LIBRARY-SURFACE]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-022"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "11",
    "heading": "11.   WMLBROWSER",
    "normalizedTextSha256": "e6ec1dd1321e6eb8be25e7ef672e5415aea3e6f4da17d6407bae5ba59d775e3c"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Expose the complete wmlbrowser standard-library namespace and its selected functions through the WMLScript library-call boundary.",
  "workItems": [
    "W1-05",
    "WMLS-504"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-017"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
