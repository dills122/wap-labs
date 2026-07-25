---
id: "scr-row:WML-C-11"
key: "WML-C-11"
type: "scr-row"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# Initialisation (newcontext)

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wml|wml]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` ← [[clauses/WML-CL-CARD-CONTEXT-ATTRIBUTE|WML-CL-CARD-CONTEXT-ATTRIBUTE]]
- `refines` ← [[clauses/WML-CL-NEWCONTEXT-CLEAR-HISTORY|WML-CL-NEWCONTEXT-CLEAR-HISTORY]]
- `refines` ← [[clauses/WML-CL-NEWCONTEXT-GO-ONLY|WML-CL-NEWCONTEXT-GO-ONLY]]
- `refines` ← [[clauses/WML-CL-NEWCONTEXT-RESET-PRIVATE-STATE|WML-CL-NEWCONTEXT-RESET-PRIVATE-STATE]]
- `refines` ← [[clauses/WML-CL-NEWCONTEXT-UNSET-VARIABLES|WML-CL-NEWCONTEXT-UNSET-VARIABLES]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]

## Data

```json
{
  "family": "wml",
  "ordinal": 11,
  "actor": "wml-user-agent",
  "referencedSection": "10.2",
  "specificationStatus": "mandatory",
  "dependencyExpression": {
    "type": "none",
    "scrIds": []
  },
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "staticConformanceSection": "15.1.3",
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
  "assessmentNote": "The WML card newcontext attribute is not parsed or applied during go traversal; WMLScript newContext support is not a substitute.",
  "implementationEvidence": [],
  "testEvidence": [],
  "ownerLayers": [
    "engine-wasm",
    "browser"
  ],
  "requirementIds": [
    "RQ-RMK-003"
  ],
  "matrixWorkItems": [
    "WML-201"
  ],
  "workItems": [
    "R0-01",
    "R0-03",
    "WML-201"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-wml-scr.json"
}
```
