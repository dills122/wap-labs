---
id: "clause:WMLSCRIPT-LIBRARIES-CL-FLOAT-LIBRARY-INTEGER-ONLY-RESULT"
key: "WMLSCRIPT-LIBRARIES-CL-FLOAT-LIBRARY-INTEGER-ONLY-RESULT"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Return invalid from every Float library function when floating-point operations are unavailable.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-007|RQ-WMLS-007]]
- `maps-to` → [[requirements/RQ-WMLS-014|RQ-WMLS-014]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `refines` → [[scr-rows/WMLSSL-046|WMLSSL-046]]
- `refines` → [[scr-rows/WMLSSL-047|WMLSSL-047]]
- `refines` → [[scr-rows/WMLSSL-049|WMLSSL-049]]
- `refines` → [[scr-rows/WMLSSL-050|WMLSSL-050]]
- `refines` → [[scr-rows/WMLSSL-051|WMLSSL-051]]
- `refines` → [[scr-rows/WMLSSL-052|WMLSSL-052]]
- `refines` → [[scr-rows/WMLSSL-053|WMLSSL-053]]
- `refines` → [[scr-rows/WMLSSL-054|WMLSSL-054]]
- `refines` → [[scr-rows/WMLSSL048|WMLSSL048]]
- `sourced-from` → [[source-documents/WAP-194-WMLScriptLibraries|WAP-194-WMLScriptLibraries]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-FLOAT-LIBRARY-INTEGER-ONLY-RESULT|WMLSCRIPT-LIBRARIES-FX-FLOAT-LIBRARY-INTEGER-ONLY-RESULT]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-046",
    "WMLSSL-047",
    "WMLSSL048",
    "WMLSSL-049",
    "WMLSSL-050",
    "WMLSSL-051",
    "WMLSSL-052",
    "WMLSSL-053",
    "WMLSSL-054"
  ],
  "sourceAnchor": {
    "documentId": "WAP-194-WMLScriptLibraries",
    "section": "8",
    "heading": "8.    FLOAT",
    "normalizedTextSha256": "57e4ccbdc4e987b82289599a3f424aa4bb3732ab90f4faa4615deb2059b209e0"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Return invalid from every Float library function when floating-point operations are unavailable.",
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
