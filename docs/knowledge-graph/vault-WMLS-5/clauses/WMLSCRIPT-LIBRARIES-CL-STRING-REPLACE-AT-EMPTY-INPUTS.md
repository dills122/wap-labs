---
id: "clause:WMLSCRIPT-LIBRARIES-CL-STRING-REPLACE-AT-EMPTY-INPUTS"
key: "WMLSCRIPT-LIBRARIES-CL-STRING-REPLACE-AT-EMPTY-INPUTS"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Return the replacement element for empty input text and invalid for an empty separator.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-015|RQ-WMLS-015]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `refines` → [[scr-rows/WMLSSL-064|WMLSSL-064]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-STRING-REPLACE-AT-EMPTY-INPUTS|WMLSCRIPT-LIBRARIES-FX-STRING-REPLACE-AT-EMPTY-INPUTS]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-064"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "9.10",
    "heading": "9.10 replaceAt",
    "normalizedTextSha256": "1aac5390f8729f188fc38372051c93d7230f1cb8e9a555d0728b680320dd3a92"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Return the replacement element for empty input text and invalid for an empty separator.",
  "workItems": [
    "W1-05",
    "WMLS-504"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-015"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
