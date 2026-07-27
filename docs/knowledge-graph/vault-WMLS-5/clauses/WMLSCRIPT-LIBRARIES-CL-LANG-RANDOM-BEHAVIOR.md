---
id: "clause:WMLSCRIPT-LIBRARIES-CL-LANG-RANDOM-BEHAVIOR"
key: "WMLSCRIPT-LIBRARIES-CL-LANG-RANDOM-BEHAVIOR"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Return an approximately uniformly selected integer between zero and the nonnegative bound, inclusive, using an implementation-dependent random strategy.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-013|RQ-WMLS-013]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `refines` → [[scr-rows/WMLSSL-043|WMLSSL-043]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-LANG-RANDOM-BEHAVIOR|WMLSCRIPT-LIBRARIES-FX-LANG-RANDOM-BEHAVIOR]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-043"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "7.13",
    "heading": "7.13 random",
    "normalizedTextSha256": "3353d8695aeb0145d54dfdaa30a6ab7468da2c3d3dbe702d0f90c7a40ca9ac9f"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Return an approximately uniformly selected integer between zero and the nonnegative bound, inclusive, using an implementation-dependent random strategy.",
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
