---
id: "scr-row:WMLS-C-079"
key: "WMLS-C-079"
type: "scr-row"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# Fragment anchors

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wmlscript|wmlscript]]
- `planned-by` → [[work-items/WMLS-501|WMLS-501]]
- `planned-by` → [[work-items/WMLS-503|WMLS-503]]
- `refines` ← [[clauses/WMLSCRIPT-CL-FRAGMENT-DOCUMENT-FORM|WMLSCRIPT-CL-FRAGMENT-DOCUMENT-FORM]]
- `refines` ← [[clauses/WMLSCRIPT-CL-FRAGMENT-FUNCTION-IDENTITY|WMLSCRIPT-CL-FRAGMENT-FUNCTION-IDENTITY]]
- `refines` ← [[clauses/WMLSCRIPT-CL-FUNCTION-NAME-TABLE|WMLSCRIPT-CL-FUNCTION-NAME-TABLE]]
- `refines` ← [[clauses/WMLSCRIPT-CL-URL-CALL-EXTERNAL-MATCH|WMLSCRIPT-CL-URL-CALL-EXTERNAL-MATCH]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]

## Data

```json
{
  "family": "wmlscript",
  "ordinal": 79,
  "actor": "wmlscript-interpreter",
  "referencedSection": "Fragment anchors",
  "specificationStatus": "mandatory",
  "dependencyExpression": {
    "type": "none",
    "scrIds": []
  },
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "staticConformanceSection": "15.2.3"
  },
  "disposition": {
    "strict": "required-for-claimed-actor",
    "classCProfile": "required-by-class-c-client-mcf",
    "enhancementMayReplaceStrictBehavior": false
  },
  "reviewState": "source-extracted-class-c-applied-mapping-provisional",
  "implementationStatus": "missing",
  "evidenceState": "gap-work-item-mapped",
  "assessmentNote": "No implementation and direct normative test evidence currently closes this selected WAP-193 interpreter requirement.",
  "implementationEvidence": [],
  "testEvidence": [],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-001",
    "RQ-WMLS-003"
  ],
  "matrixWorkItems": [
    "WMLS-501"
  ],
  "workItems": [
    "W0-08",
    "W1-03",
    "WMLS-501",
    "WMLS-503"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-wmlscript-scr.json"
}
```
