---
id: "scr-row:WML-C-08"
key: "WML-C-08"
type: "scr-row"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# Card/Deck task shadowing

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wml|wml]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` ← [[clauses/WML-CL-DO-EFFECTIVE-NAME|WML-CL-DO-EFFECTIVE-NAME]]
- `refines` ← [[clauses/WML-CL-DO-INACTIVE-HIDDEN|WML-CL-DO-INACTIVE-HIDDEN]]
- `refines` ← [[clauses/WML-CL-INTRINSIC-CARD-OVERRIDES-TEMPLATE|WML-CL-INTRINSIC-CARD-OVERRIDES-TEMPLATE]]
- `refines` ← [[clauses/WML-CL-SHADOW-ACTIVE-SET|WML-CL-SHADOW-ACTIVE-SET]]
- `refines` ← [[clauses/WML-CL-SHADOW-CARD-PRECEDENCE|WML-CL-SHADOW-CARD-PRECEDENCE]]
- `refines` ← [[clauses/WML-CL-SHADOW-MATCHING|WML-CL-SHADOW-MATCHING]]
- `refines` ← [[clauses/WML-CL-SHADOW-NOOP-MASK|WML-CL-SHADOW-NOOP-MASK]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]

## Data

```json
{
  "family": "wml",
  "ordinal": 8,
  "actor": "wml-user-agent",
  "referencedSection": "9.6",
  "specificationStatus": "mandatory",
  "dependencyExpression": {
    "type": "none",
    "scrIds": []
  },
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "staticConformanceSection": "15.1.2",
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
  "assessmentNote": "The shared deck runtime resolves ordered card and template do/onevent bindings by effective identity, applies card precedence, and removes noop bindings without task side effects.",
  "implementationEvidence": [
    {
      "path": "engine-wasm/engine/src/runtime/deck.rs",
      "symbol": "active_event_bindings"
    },
    {
      "path": "engine-wasm/engine/src/engine_runtime_internal/navigation.rs",
      "symbol": "active_onevent_action_internal"
    }
  ],
  "testEvidence": [
    {
      "path": "engine-wasm/engine/src/engine_tests/actions_timers.rs",
      "test": "wml_202_template_do_shadowing_and_noop_masking_cover_all_active_set_cases",
      "command": "cd engine-wasm/engine && cargo test wml_202_template_do_shadowing_and_noop_masking_cover_all_active_set_cases"
    },
    {
      "path": "engine-wasm/engine/src/engine_tests/actions_timers.rs",
      "test": "wml_202_card_intrinsic_binding_masks_or_overrides_template_binding",
      "command": "cd engine-wasm/engine && cargo test wml_202_card_intrinsic_binding_masks_or_overrides_template_binding"
    }
  ],
  "ownerLayers": [
    "engine-wasm",
    "browser"
  ],
  "requirementIds": [
    "RQ-RMK-002"
  ],
  "matrixWorkItems": [
    "WML-201"
  ],
  "workItems": [
    "R0-01",
    "R0-02",
    "R0-12",
    "WML-201"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-wml-scr.json"
}
```
