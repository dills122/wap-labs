---
id: "clause:WMLSCRIPT-LIBRARIES-CL-WMLBROWSER-PREV-FATAL-CANCELS"
key: "WMLSCRIPT-LIBRARIES-CL-WMLBROWSER-PREV-FATAL-CANCELS"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Cancel pending prev navigation when Lang.abort or another fatal WMLScript error terminates the invocation.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-018|RQ-WMLS-018]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `planned-by` → [[work-items/WMLS-505|WMLS-505]]
- `refines` → [[scr-rows/WMLSSL-088|WMLSSL-088]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-WMLBROWSER-PREV-FATAL-CANCELS|WMLSCRIPT-LIBRARIES-FX-WMLBROWSER-PREV-FATAL-CANCELS]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-088"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "11.4",
    "heading": "11.4 prev",
    "normalizedTextSha256": "3a50239b2e61294d5dc72e0bebaa235d5d1bbc07616ed35a5b3a91500eba6fc2"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Cancel pending prev navigation when Lang.abort or another fatal WMLScript error terminates the invocation.",
  "workItems": [
    "W0-07",
    "W1-05",
    "WMLS-504",
    "WMLS-505"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-018"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
