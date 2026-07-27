---
id: "clause:WMLSCRIPT-LIBRARIES-CL-LANG-IS-INT-SIGNATURE"
key: "WMLSCRIPT-LIBRARIES-CL-LANG-IS-INT-SIGNATURE"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Implement Lang.isInt(value) for an Any argument, returning Boolean or invalid.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-013|RQ-WMLS-013]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `refines` → [[scr-rows/WMLSSL-036|WMLSSL-036]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-LANG-IS-INT-SIGNATURE|WMLSCRIPT-LIBRARIES-FX-LANG-IS-INT-SIGNATURE]]

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
  "normativeForce": "table",
  "obligationLevel": "required",
  "obligationSynopsis": "Implement Lang.isInt(value) for an Any argument, returning Boolean or invalid.",
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
