---
id: "scr-row:WML-C-47"
key: "WML-C-47"
type: "scr-row"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# template

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wml|wml]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` ← [[clauses/WML-CL-INTRINSIC-CARD-OVERRIDES-TEMPLATE|WML-CL-INTRINSIC-CARD-OVERRIDES-TEMPLATE]]
- `refines` ← [[clauses/WML-CL-SHADOW-CARD-PRECEDENCE|WML-CL-SHADOW-CARD-PRECEDENCE]]
- `refines` ← [[clauses/WML-CL-SHADOW-MATCHING|WML-CL-SHADOW-MATCHING]]
- `refines` ← [[clauses/WML-CL-TEMPLATE-APPLIES-ALL-CARDS|WML-CL-TEMPLATE-APPLIES-ALL-CARDS]]
- `refines` ← [[clauses/WML-CL-TEMPLATE-STRUCTURE|WML-CL-TEMPLATE-STRUCTURE]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]

## Data

```json
{
  "family": "wml",
  "ordinal": 47,
  "actor": "wml-user-agent",
  "referencedSection": "11.4",
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
  "assessmentNote": "The parser retains one deck-level template with ordered do/onevent bindings and card-event attributes; the shared runtime applies those bindings to every card unless shadowed.",
  "implementationEvidence": [
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/actions.rs",
      "symbol": "parse_template_bindings"
    },
    {
      "path": "engine-wasm/engine/src/runtime/deck.rs",
      "symbol": "active_event_bindings"
    }
  ],
  "testEvidence": [
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/tests.rs",
      "test": "wml_202_rejects_invalid_template_structure_deterministically",
      "command": "cd engine-wasm/engine && cargo test wml_202_rejects_invalid_template_structure_deterministically"
    },
    {
      "path": "engine-wasm/engine/src/engine_tests/actions_timers.rs",
      "test": "wml_202_template_bindings_persist_across_navigation_and_back",
      "command": "cd engine-wasm/engine && cargo test wml_202_template_bindings_persist_across_navigation_and_back"
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
    "R0-12",
    "WML-201"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-wml-scr.json"
}
```
