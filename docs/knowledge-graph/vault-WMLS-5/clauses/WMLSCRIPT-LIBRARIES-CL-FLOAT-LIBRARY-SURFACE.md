---
id: "clause:WMLSCRIPT-LIBRARIES-CL-FLOAT-LIBRARY-SURFACE"
key: "WMLSCRIPT-LIBRARIES-CL-FLOAT-LIBRARY-SURFACE"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Expose the complete float standard-library namespace and its selected functions through the WMLScript library-call boundary.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-007|RQ-WMLS-007]]
- `maps-to` → [[requirements/RQ-WMLS-014|RQ-WMLS-014]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `refines` → [[scr-rows/WMLSSL-019|WMLSSL-019]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-FLOAT-LIBRARY-SURFACE|WMLSCRIPT-LIBRARIES-FX-FLOAT-LIBRARY-SURFACE]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-019"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "8",
    "heading": "8.    FLOAT",
    "normalizedTextSha256": "57e4ccbdc4e987b82289599a3f424aa4bb3732ab90f4faa4615deb2059b209e0"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Expose the complete float standard-library namespace and its selected functions through the WMLScript library-call boundary.",
  "workItems": [
    "W1-05",
    "WMLS-504"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-007",
    "RQ-WMLS-014"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
