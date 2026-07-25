---
id: "scr-row:WML-C-21"
key: "WML-C-21"
type: "scr-row"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# access

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wml|wml]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` ← [[clauses/WML-CL-ACCESS-ABSENT-ALLOWS|WML-CL-ACCESS-ABSENT-ALLOWS]]
- `refines` ← [[clauses/WML-CL-ACCESS-COMPONENT-MATCH|WML-CL-ACCESS-COMPONENT-MATCH]]
- `refines` ← [[clauses/WML-CL-ACCESS-DEFAULTS|WML-CL-ACCESS-DEFAULTS]]
- `refines` ← [[clauses/WML-CL-ACCESS-REFERRER-MATCH|WML-CL-ACCESS-REFERRER-MATCH]]
- `refines` ← [[clauses/WML-CL-ACCESS-RELATIVE-PATH|WML-CL-ACCESS-RELATIVE-PATH]]
- `refines` ← [[clauses/WML-CL-ACCESS-SINGLE-ELEMENT|WML-CL-ACCESS-SINGLE-ELEMENT]]
- `refines` ← [[clauses/WML-CL-ACCESS-URL-CASE-RULES|WML-CL-ACCESS-URL-CASE-RULES]]
- `refines` ← [[clauses/WML-CL-DECK-ACCESS-REQUIRED|WML-CL-DECK-ACCESS-REQUIRED]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]

## Data

```json
{
  "family": "wml",
  "ordinal": 21,
  "actor": "wml-user-agent",
  "referencedSection": "11.3.1",
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
  "assessmentNote": "The access element's authored domain/path attributes are parsed and retained on the deck model, its EMPTY grammar is validated, and a second access element is rejected deterministically. Enforcement of defaults and referring-URI suffix/prefix policy remains the cross-boundary R0-07 scope, so this parent obligation stays partial.",
  "implementationEvidence": [
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/head.rs",
      "symbol": "parse_access"
    },
    {
      "path": "engine-wasm/engine/src/runtime/deck.rs",
      "symbol": "DeckAccessControl"
    }
  ],
  "testEvidence": [
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/tests.rs",
      "test": "wml_202_retains_access_and_ordered_meta_for_the_whole_deck",
      "command": "cd engine-wasm/engine && cargo test wml_202_retains_access_and_ordered_meta_for_the_whole_deck"
    },
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/tests.rs",
      "test": "wml_202_rejects_invalid_head_access_and_meta_structure_deterministically",
      "command": "cd engine-wasm/engine && cargo test wml_202_rejects_invalid_head_access_and_meta_structure_deterministically"
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
