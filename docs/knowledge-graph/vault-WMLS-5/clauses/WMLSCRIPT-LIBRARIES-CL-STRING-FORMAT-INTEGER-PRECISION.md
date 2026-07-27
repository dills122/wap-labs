---
id: "clause:WMLSCRIPT-LIBRARIES-CL-STRING-FORMAT-INTEGER-PRECISION"
key: "WMLSCRIPT-LIBRARIES-CL-STRING-FORMAT-INTEGER-PRECISION"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# For d, zero-pad to precision, default precision to one, and produce empty output for zero with zero precision.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-015|RQ-WMLS-015]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `refines` → [[scr-rows/WMLSSL-070|WMLSSL-070]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-STRING-FORMAT-INTEGER-PRECISION|WMLSCRIPT-LIBRARIES-FX-STRING-FORMAT-INTEGER-PRECISION]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-070"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "9.16",
    "heading": "9.16 format",
    "normalizedTextSha256": "fdd8e94e13cf8d218fdc12357a22e8757b2beb67263461c28c14326361080b4a"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "For d, zero-pad to precision, default precision to one, and produce empty output for zero with zero precision.",
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
