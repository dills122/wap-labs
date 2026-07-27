---
id: "clause:WMLSCRIPT-LIBRARIES-CL-STRING-REMOVE-AT-BEHAVIOR"
key: "WMLSCRIPT-LIBRARIES-CL-STRING-REMOVE-AT-BEHAVIOR"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Remove the selected element and its corresponding separator, converting Float index and clamping indexes to the first or last element.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-015|RQ-WMLS-015]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `refines` → [[scr-rows/WMLSSL-063|WMLSSL-063]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-STRING-REMOVE-AT-BEHAVIOR|WMLSCRIPT-LIBRARIES-FX-STRING-REMOVE-AT-BEHAVIOR]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-063"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "9.9",
    "heading": "9.9   removeAt",
    "normalizedTextSha256": "c892a6c1c0b69873f92499b43a73df41e844e871fabbc49ec3258573a1aa47d5"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Remove the selected element and its corresponding separator, converting Float index and clamping indexes to the first or last element.",
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
