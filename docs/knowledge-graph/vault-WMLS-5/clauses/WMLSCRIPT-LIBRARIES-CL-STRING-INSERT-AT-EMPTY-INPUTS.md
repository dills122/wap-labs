---
id: "clause:WMLSCRIPT-LIBRARIES-CL-STRING-INSERT-AT-EMPTY-INPUTS"
key: "WMLSCRIPT-LIBRARIES-CL-STRING-INSERT-AT-EMPTY-INPUTS"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Return the inserted element for empty input text and invalid for an empty separator.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-015|RQ-WMLS-015]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `refines` → [[scr-rows/WMLSSL-065|WMLSSL-065]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-STRING-INSERT-AT-EMPTY-INPUTS|WMLSCRIPT-LIBRARIES-FX-STRING-INSERT-AT-EMPTY-INPUTS]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-065"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "9.11",
    "heading": "9.11 insertAt",
    "normalizedTextSha256": "ff0fb299ea6a464161fa582935497677166230aead3292bb6aae7095af5eaac8"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Return the inserted element for empty input text and invalid for an empty separator.",
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
