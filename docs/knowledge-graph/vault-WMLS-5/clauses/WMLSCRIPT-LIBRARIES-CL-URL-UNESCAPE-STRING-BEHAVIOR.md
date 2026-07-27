---
id: "clause:WMLSCRIPT-LIBRARIES-CL-URL-UNESCAPE-STRING-BEHAVIOR"
key: "WMLSCRIPT-LIBRARIES-CL-URL-UNESCAPE-STRING-BEHAVIOR"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Replace percent escape sequences with represented characters without parsing the value as a URL.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-016|RQ-WMLS-016]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `refines` → [[scr-rows/WMLSSL-083|WMLSSL-083]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-URL-UNESCAPE-STRING-BEHAVIOR|WMLSCRIPT-LIBRARIES-FX-URL-UNESCAPE-STRING-BEHAVIOR]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-083"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "10.13",
    "heading": "10.13   unescapeString",
    "normalizedTextSha256": "9c0fdca672c43e056009656517958a24eae8d9e234d92be7cb9302ff7652eaab"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Replace percent escape sequences with represented characters without parsing the value as a URL.",
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
