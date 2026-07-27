---
id: "clause:WMLSCRIPT-LIBRARIES-CL-LANG-IS-INT-BEHAVIOR"
key: "WMLSCRIPT-LIBRARIES-CL-LANG-IS-INT-BEHAVIOR"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Return true exactly when Lang.parseInt can convert the value, false for a non-convertible non-invalid value, and invalid for invalid input.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-013|RQ-WMLS-013]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `refines` → [[scr-rows/WMLSSL-036|WMLSSL-036]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-LANG-IS-INT-BEHAVIOR|WMLSCRIPT-LIBRARIES-FX-LANG-IS-INT-BEHAVIOR]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-036"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "7.6",
    "heading": "7.6   isInt",
    "normalizedTextSha256": "35ccd1e4cc81d98043f55290b919ff0fe444d61f4a33613a67a27bed14cee7cd"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Return true exactly when Lang.parseInt can convert the value, false for a non-convertible non-invalid value, and invalid for invalid input.",
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
