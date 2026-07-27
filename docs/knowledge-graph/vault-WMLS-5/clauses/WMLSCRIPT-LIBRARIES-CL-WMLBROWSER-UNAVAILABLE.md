---
id: "clause:WMLSCRIPT-LIBRARIES-CL-WMLBROWSER-UNAVAILABLE"
key: "WMLSCRIPT-LIBRARIES-CL-WMLBROWSER-UNAVAILABLE"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# When no WML browser is available or it did not invoke the interpreter, return invalid from every WMLBrowser function without WML-context side effects.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-017|RQ-WMLS-017]]
- `maps-to` → [[requirements/RQ-WMLS-018|RQ-WMLS-018]]
- `maps-to` → [[requirements/RQ-WMLS-019|RQ-WMLS-019]]
- `maps-to` → [[requirements/RQ-WMLS-020|RQ-WMLS-020]]
- `maps-to` → [[requirements/RQ-WMLS-021|RQ-WMLS-021]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `planned-by` → [[work-items/WMLS-505|WMLS-505]]
- `refines` → [[scr-rows/WMLSSL-085|WMLSSL-085]]
- `refines` → [[scr-rows/WMLSSL-086|WMLSSL-086]]
- `refines` → [[scr-rows/WMLSSL-087|WMLSSL-087]]
- `refines` → [[scr-rows/WMLSSL-088|WMLSSL-088]]
- `refines` → [[scr-rows/WMLSSL-089|WMLSSL-089]]
- `refines` → [[scr-rows/WMLSSL-090|WMLSSL-090]]
- `refines` → [[scr-rows/WMLSSL-091|WMLSSL-091]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-WMLBROWSER-UNAVAILABLE|WMLSCRIPT-LIBRARIES-FX-WMLBROWSER-UNAVAILABLE]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-085",
    "WMLSSL-086",
    "WMLSSL-087",
    "WMLSSL-088",
    "WMLSSL-089",
    "WMLSSL-090",
    "WMLSSL-091"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "11",
    "heading": "11.   WMLBROWSER",
    "normalizedTextSha256": "e6ec1dd1321e6eb8be25e7ef672e5415aea3e6f4da17d6407bae5ba59d775e3c"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "When no WML browser is available or it did not invoke the interpreter, return invalid from every WMLBrowser function without WML-context side effects.",
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
    "RQ-WMLS-017",
    "RQ-WMLS-018",
    "RQ-WMLS-019",
    "RQ-WMLS-020",
    "RQ-WMLS-021"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
