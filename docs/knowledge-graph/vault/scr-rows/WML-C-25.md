---
id: "scr-row:WML-C-25"
key: "WML-C-25"
type: "scr-row"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# card

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wml|wml]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` ← [[clauses/WML-CL-CARD-COLLECTION|WML-CL-CARD-COLLECTION]]
- `refines` ← [[clauses/WML-CL-CARD-CONTENT-ORDER|WML-CL-CARD-CONTENT-ORDER]]
- `refines` ← [[clauses/WML-CL-CARD-CONTEXT-ATTRIBUTE|WML-CL-CARD-CONTEXT-ATTRIBUTE]]
- `refines` ← [[clauses/WML-CL-CARD-ID-FRAGMENT|WML-CL-CARD-ID-FRAGMENT]]
- `refines` ← [[clauses/WML-CL-CARD-STRUCTURE|WML-CL-CARD-STRUCTURE]]
- `refines` ← [[clauses/WML-CL-CARD-TABLE-BOUNDARIES|WML-CL-CARD-TABLE-BOUNDARIES]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]

## Data

```json
{
  "family": "wml",
  "ordinal": 25,
  "actor": "wml-user-agent",
  "referencedSection": "11.5",
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
  "implementationStatus": "partial",
  "evidenceState": "direct-test-linked",
  "assessmentNote": "Card identity, ordering, and content are parsed; mandatory card attributes and lifecycle semantics are only partially retained.",
  "implementationEvidence": [
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/mod.rs",
      "symbol": "parse_wml"
    }
  ],
  "testEvidence": [
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/tests.rs",
      "test": "parses_cards_and_links",
      "command": "cd engine-wasm/engine && cargo test parses_cards_and_links"
    }
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-RMK-001"
  ],
  "matrixWorkItems": [
    "WML-201"
  ],
  "workItems": [
    "R0-01",
    "R0-04",
    "WML-201"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-wml-scr.json"
}
```
