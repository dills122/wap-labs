---
id: "scr-row:WML-C-15"
key: "WML-C-15"
type: "scr-row"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# Low-memory behaviour

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wml|wml]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]

## Data

```json
{
  "family": "wml",
  "ordinal": 15,
  "actor": "wml-user-agent",
  "referencedSection": "12.2",
  "specificationStatus": "optional",
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
    "strict": "declare-implemented-or-deferred",
    "classCProfile": "optional-not-required-by-class-c-client",
    "enhancementMayReplaceStrictBehavior": false
  },
  "reviewState": "source-extracted-class-c-applied-mapping-provisional",
  "implementationStatus": "not-assessed",
  "evidenceState": "optional-not-assessed",
  "assessmentNote": "Optional capability implementation is deferred to the capability-declaration pass.",
  "implementationEvidence": [],
  "testEvidence": [],
  "ownerLayers": [
    "engine-wasm",
    "browser"
  ],
  "requirementIds": [],
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
