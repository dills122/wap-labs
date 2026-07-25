---
id: "scr-row:WML-C-46"
key: "WML-C-46"
type: "scr-row"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# table

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wml|wml]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` ← [[clauses/WML-CL-CARD-TABLE-BOUNDARIES|WML-CL-CARD-TABLE-BOUNDARIES]]
- `refines` ← [[clauses/WML-CL-TABLE-ALIGNMENT-DESIGNATORS|WML-CL-TABLE-ALIGNMENT-DESIGNATORS]]
- `refines` ← [[clauses/WML-CL-TABLE-EXACT-COLUMNS|WML-CL-TABLE-EXACT-COLUMNS]]
- `refines` ← [[clauses/WML-CL-TABLE-LONG-ROW-AGGREGATION|WML-CL-TABLE-LONG-ROW-AGGREGATION]]
- `refines` ← [[clauses/WML-CL-TABLE-NONZERO-GUTTER|WML-CL-TABLE-NONZERO-GUTTER]]
- `refines` ← [[clauses/WML-CL-TABLE-SHORT-ROW-PADDING|WML-CL-TABLE-SHORT-ROW-PADDING]]
- `refines` ← [[clauses/WML-CL-TABLE-STRUCTURE|WML-CL-TABLE-STRUCTURE]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]

## Data

```json
{
  "family": "wml",
  "ordinal": 46,
  "actor": "wml-user-agent",
  "referencedSection": "11.8.5",
  "specificationStatus": "mandatory",
  "dependencyExpression": {
    "type": "none",
    "scrIds": []
  },
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "staticConformanceSection": "15.1.5",
    "changeSection": null
  },
  "disposition": {
    "strict": "required-for-claimed-actor",
    "classCProfile": "required-by-class-c-client-mcf",
    "enhancementMayReplaceStrictBehavior": false
  },
  "reviewState": "source-extracted-class-c-applied-mapping-provisional",
  "implementationStatus": "missing",
  "evidenceState": "gap-work-item-mapped",
  "assessmentNote": "Table structure, column normalization, alignment, and layout are not represented.",
  "implementationEvidence": [],
  "testEvidence": [],
  "ownerLayers": [
    "engine-wasm",
    "browser"
  ],
  "requirementIds": [
    "RQ-RMK-001"
  ],
  "matrixWorkItems": [
    "WML-201"
  ],
  "workItems": [
    "R0-01",
    "R0-05",
    "WML-201"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-wml-scr.json"
}
```
