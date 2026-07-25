---
id: "scr-row:WML-C-30"
key: "WML-C-30"
type: "scr-row"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# head

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wml|wml]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` ← [[clauses/WML-CL-HEAD-DECK-SCOPE|WML-CL-HEAD-DECK-SCOPE]]
- `refines` ← [[clauses/WML-CL-HEAD-STRUCTURE|WML-CL-HEAD-STRUCTURE]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]

## Data

```json
{
  "family": "wml",
  "ordinal": 30,
  "actor": "wml-user-agent",
  "referencedSection": "11.3",
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
  "implementationStatus": "implemented",
  "evidenceState": "direct-test-linked",
  "assessmentNote": "The head element is recognized at the deck level (not mistaken for a card) and its access child is extracted onto the deck model. The meta child (WML-C-34, optional) is not yet represented and is tolerated as an unimplemented-optional element, consistent with this parser's existing handling of other unsupported optional constructs.",
  "implementationEvidence": [
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/mod.rs",
      "symbol": "parse_wml"
    }
  ],
  "testEvidence": [
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/tests.rs",
      "test": "parse_wml_populates_deck_access_control_from_head",
      "command": "cd engine-wasm/engine && cargo test parse_wml_populates_deck_access_control_from_head"
    },
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/tests.rs",
      "test": "parse_wml_honors_only_first_head_when_deck_has_more_than_one",
      "command": "cd engine-wasm/engine && cargo test parse_wml_honors_only_first_head_when_deck_has_more_than_one"
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
