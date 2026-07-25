---
id: "scr-row:WML-C-14"
key: "WML-C-14"
type: "scr-row"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# Deck access control

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wml|wml]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` ← [[clauses/WML-CL-DECK-ACCESS-REQUIRED|WML-CL-DECK-ACCESS-REQUIRED]]
- `refines` ← [[clauses/WML-CL-GO-ACCESS-BEFORE-TRANSITION|WML-CL-GO-ACCESS-BEFORE-TRANSITION]]
- `refines` ← [[clauses/WML-CL-GO-REFERER|WML-CL-GO-REFERER]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]

## Data

```json
{
  "family": "wml",
  "ordinal": 14,
  "actor": "wml-user-agent",
  "referencedSection": "12.1",
  "specificationStatus": "mandatory",
  "dependencyExpression": {
    "type": "none",
    "scrIds": []
  },
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "staticConformanceSection": "15.1.4",
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
  "assessmentNote": "Deck access, domain, path, and sendreferer enforcement is not implemented.",
  "implementationEvidence": [],
  "testEvidence": [],
  "ownerLayers": [
    "engine-wasm",
    "browser"
  ],
  "requirementIds": [
    "RQ-RMK-011"
  ],
  "matrixWorkItems": [
    "WML-201"
  ],
  "workItems": [
    "R0-01",
    "R0-07",
    "WML-201"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-wml-scr.json"
}
```
