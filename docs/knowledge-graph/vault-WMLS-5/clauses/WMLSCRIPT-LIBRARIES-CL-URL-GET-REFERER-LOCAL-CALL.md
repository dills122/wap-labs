---
id: "clause:WMLSCRIPT-LIBRARIES-CL-URL-GET-REFERER-LOCAL-CALL"
key: "WMLSCRIPT-LIBRARIES-CL-URL-GET-REFERER-LOCAL-CALL"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Do not change the referer when execution crosses a local function call.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-016|RQ-WMLS-016]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `refines` → [[scr-rows/WMLSSL-080|WMLSSL-080]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-URL-GET-REFERER-LOCAL-CALL|WMLSCRIPT-LIBRARIES-FX-URL-GET-REFERER-LOCAL-CALL]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-080"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "10.10",
    "heading": "10.10   getReferer",
    "normalizedTextSha256": "ff6ef6c8ac149be3bf02fc595515812b2305ee0a71f6c8bb8116e681f96a9543"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Do not change the referer when execution crosses a local function call.",
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
