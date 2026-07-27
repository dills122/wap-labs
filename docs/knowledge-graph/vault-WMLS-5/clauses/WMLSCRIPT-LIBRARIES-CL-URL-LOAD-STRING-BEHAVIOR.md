---
id: "clause:WMLSCRIPT-LIBRARIES-CL-URL-LOAD-STRING-BEHAVIOR"
key: "WMLSCRIPT-LIBRARIES-CL-URL-LOAD-STRING-BEHAVIOR"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Load the absolute URL with user-agent defaults and return decoded text only when the response content type matches the requested content type.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-016|RQ-WMLS-016]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `refines` → [[scr-rows/WMLSSL-084|WMLSSL-084]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-URL-LOAD-STRING-BEHAVIOR|WMLSCRIPT-LIBRARIES-FX-URL-LOAD-STRING-BEHAVIOR]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-084"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "10.14",
    "heading": "10.14   loadString",
    "normalizedTextSha256": "7a7c26d7303acf228ded013f76fd4a22151727a2edce4be187482b79bf031dcb"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Load the absolute URL with user-agent defaults and return decoded text only when the response content type matches the requested content type.",
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
