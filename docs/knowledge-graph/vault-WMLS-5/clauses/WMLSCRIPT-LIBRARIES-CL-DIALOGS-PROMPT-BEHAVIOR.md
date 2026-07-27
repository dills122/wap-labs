---
id: "clause:WMLSCRIPT-LIBRARIES-CL-DIALOGS-PROMPT-BEHAVIOR"
key: "WMLSCRIPT-LIBRARIES-CL-DIALOGS-PROMPT-BEHAVIOR"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Display the message with the supplied initial input, wait for user input, and return the entered string.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-022|RQ-WMLS-022]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `planned-by` → [[work-items/WMLS-505|WMLS-505]]
- `refines` → [[scr-rows/WMLSSL-092|WMLSSL-092]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-DIALOGS-PROMPT-BEHAVIOR|WMLSCRIPT-LIBRARIES-FX-DIALOGS-PROMPT-BEHAVIOR]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-092"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "12.1",
    "heading": "12.1 prompt",
    "normalizedTextSha256": "429526dc38347ce5c3b2accedfb90ec4b89e5d8615d78599d08c01a9298fc78d"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Display the message with the supplied initial input, wait for user input, and return the entered string.",
  "workItems": [
    "W0-05",
    "W1-05",
    "WMLS-504",
    "WMLS-505"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-022"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
