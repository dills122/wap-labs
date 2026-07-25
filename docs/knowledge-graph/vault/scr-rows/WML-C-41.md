---
id: "scr-row:WML-C-41"
key: "WML-C-41"
type: "scr-row"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# option

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wml|wml]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `planned-by` → [[work-items/WML-204|WML-204]]
- `refines` ← [[clauses/WML-CL-OPTION-ONPICK-MULTI|WML-CL-OPTION-ONPICK-MULTI]]
- `refines` ← [[clauses/WML-CL-OPTION-ONPICK-SINGLE|WML-CL-OPTION-ONPICK-SINGLE]]
- `refines` ← [[clauses/WML-CL-OPTION-VALUE-EVALUATION|WML-CL-OPTION-VALUE-EVALUATION]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]

## Data

```json
{
  "family": "wml",
  "ordinal": 41,
  "actor": "wml-user-agent",
  "referencedSection": "11.6.2.2",
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
  "assessmentNote": "Option content and allowed attributes receive deterministic DTD-derived syntax validation; text labels, explicit empty values, evaluated value references, and onpick dispatch for single selection plus multiple selection/deselection are represented. Option title/xml:lang retention, onevent task forms, and general HREF conversion remain incomplete.",
  "implementationEvidence": [
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/nodes.rs",
      "symbol": "parse_select_inline_node"
    }
  ],
  "testEvidence": [
    {
      "path": "engine-wasm/engine/src/engine_tests/navigation_metadata.rs",
      "test": "select_control_renders_first_option_by_default",
      "command": "cd engine-wasm/engine && cargo test select_control_renders_first_option_by_default"
    },
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/tests.rs",
      "test": "wml_fx_select_structure_rejects_invalid_syntax_deterministically",
      "command": "cd engine-wasm/engine && cargo test wml_fx_select_structure_rejects_invalid_syntax_deterministically"
    },
    {
      "path": "engine-wasm/engine/src/engine_tests/select_semantics.rs",
      "test": "wml_fx_select_value_and_ivalue_references_are_evaluated_before_assignment",
      "command": "cd engine-wasm/engine && cargo test wml_fx_select_value_and_ivalue_references_are_evaluated_before_assignment"
    },
    {
      "path": "engine-wasm/engine/src/engine_tests/select_semantics.rs",
      "test": "wml_fx_option_onpick_single_updates_state_before_only_selected_task",
      "command": "cd engine-wasm/engine && cargo test wml_fx_option_onpick_single_updates_state_before_only_selected_task"
    },
    {
      "path": "engine-wasm/engine/src/engine_tests/select_semantics.rs",
      "test": "wml_fx_option_onpick_multi_fires_for_deselection_after_state_update",
      "command": "cd engine-wasm/engine && cargo test wml_fx_option_onpick_multi_fires_for_deselection_after_state_update"
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
    "WML-201",
    "WML-204"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-wml-scr.json"
}
```
