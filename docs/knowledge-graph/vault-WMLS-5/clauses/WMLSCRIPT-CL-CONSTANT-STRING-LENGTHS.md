---
id: "clause:WMLSCRIPT-CL-CONSTANT-STRING-LENGTHS"
key: "WMLSCRIPT-CL-CONSTANT-STRING-LENGTHS"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Decode length-prefixed UTF-8 and externally encoded string constants without requiring a terminating null octet.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-008|RQ-WMLS-008]]
- `planned-by` → [[work-items/WMLS-501|WMLS-501]]
- `refines` → [[scr-rows/WMLS-C-090|WMLS-C-090]]
- `refines` → [[scr-rows/WMLS-C-092|WMLS-C-092]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-CONSTANT-STRING-LENGTHS|WMLSCRIPT-FX-CONSTANT-STRING-LENGTHS]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-090",
    "WMLS-C-092"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "9.4",
    "heading": "9.4 Constant Pool",
    "normalizedTextSha256": "3c6376b7bb8fd3133fd08edf1acd59dda04ac42d62881d69bb685d6dc0ec3303"
  },
  "normativeForce": "grammar",
  "obligationLevel": "required",
  "obligationSynopsis": "Decode length-prefixed UTF-8 and externally encoded string constants without requiring a terminating null octet.",
  "workItems": [
    "W1-02",
    "WMLS-501"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-008"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
