---
id: "clause:WMLSCRIPT-LIBRARIES-CL-LANG-CHARACTER-SET-BEHAVIOR"
key: "WMLSCRIPT-LIBRARIES-CL-LANG-CHARACTER-SET-BEHAVIOR"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Return the IANA MIBenum identifier for the character set used by the WMLScript interpreter.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-013|RQ-WMLS-013]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `refines` → [[scr-rows/WMLSSL-045|WMLSSL-045]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-LANG-CHARACTER-SET-BEHAVIOR|WMLSCRIPT-LIBRARIES-FX-LANG-CHARACTER-SET-BEHAVIOR]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-045"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "7.15",
    "heading": "7.15 characterSet",
    "normalizedTextSha256": "e293f143147eec09247626fdcce2d914444ba79a958ce6e8de18671fdbcae154"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Return the IANA MIBenum identifier for the character set used by the WMLScript interpreter.",
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
