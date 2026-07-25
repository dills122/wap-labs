---
id: "scr-row:WML-C-32"
key: "WML-C-32"
type: "scr-row"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# img

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wml|wml]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` ← [[clauses/WML-CL-IMAGE-ALT-FALLBACK|WML-CL-IMAGE-ALT-FALLBACK]]
- `refines` ← [[clauses/WML-CL-IMAGE-LOCAL-PRECEDENCE|WML-CL-IMAGE-LOCAL-PRECEDENCE]]
- `refines` ← [[clauses/WML-CL-IMAGE-REMOTE-FETCH|WML-CL-IMAGE-REMOTE-FETCH]]
- `refines` ← [[clauses/WML-CL-IMAGE-STRUCTURE|WML-CL-IMAGE-STRUCTURE]]
- `refines` ← [[clauses/WML-CL-IMAGE-TEXT-FLOW|WML-CL-IMAGE-TEXT-FLOW]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]

## Data

```json
{
  "family": "wml",
  "ordinal": 32,
  "actor": "wml-user-agent",
  "referencedSection": "11.9",
  "specificationStatus": "mandatory",
  "dependencyExpression": {
    "type": "all-of",
    "scrIds": [
      "WML-C-54"
    ]
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
  "assessmentNote": "The img element has no parser/runtime/render representation.",
  "implementationEvidence": [],
  "testEvidence": [],
  "ownerLayers": [
    "engine-wasm",
    "browser"
  ],
  "requirementIds": [
    "RQ-RMK-001",
    "RQ-WAE-006",
    "RQ-WAE-018"
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
