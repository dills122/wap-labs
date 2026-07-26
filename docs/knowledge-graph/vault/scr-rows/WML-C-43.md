---
id: "scr-row:WML-C-43"
key: "WML-C-43"
type: "scr-row"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# select

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wml|wml]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `planned-by` → [[work-items/WML-204|WML-204]]
- `refines` ← [[clauses/WML-CL-OPTION-VALUE-EVALUATION|WML-CL-OPTION-VALUE-EVALUATION]]
- `refines` ← [[clauses/WML-CL-SELECT-DEFAULT-PRECEDENCE|WML-CL-SELECT-DEFAULT-PRECEDENCE]]
- `refines` ← [[clauses/WML-CL-SELECT-INDEX-VALIDATION|WML-CL-SELECT-INDEX-VALIDATION]]
- `refines` ← [[clauses/WML-CL-SELECT-INIT-ORDER|WML-CL-SELECT-INIT-ORDER]]
- `refines` ← [[clauses/WML-CL-SELECT-MULTI-SERIALIZATION|WML-CL-SELECT-MULTI-SERIALIZATION]]
- `refines` ← [[clauses/WML-CL-SELECT-NO-IMPLICIT-REFRESH|WML-CL-SELECT-NO-IMPLICIT-REFRESH]]
- `refines` ← [[clauses/WML-CL-SELECT-PRESELECTION|WML-CL-SELECT-PRESELECTION]]
- `refines` ← [[clauses/WML-CL-SELECT-SINGLE-MULTI-MODE|WML-CL-SELECT-SINGLE-MULTI-MODE]]
- `refines` ← [[clauses/WML-CL-SELECT-STRUCTURE|WML-CL-SELECT-STRUCTURE]]
- `refines` ← [[clauses/WML-CL-SELECT-USER-UPDATE|WML-CL-SELECT-USER-UPDATE]]
- `refines` ← [[clauses/WML-CL-SELECT-VARIABLE-INITIALIZATION|WML-CL-SELECT-VARIABLE-INITIALIZATION]]
- `refines` ← [[clauses/WML-CL-VARIABLE-COMMIT-BEFORE-TASK|WML-CL-VARIABLE-COMMIT-BEFORE-TASK]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]

## Data

```json
{
  "family": "wml",
  "ordinal": 43,
  "actor": "wml-user-agent",
  "referencedSection": "11.6.2.1",
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
  "assessmentNote": "Select has deterministic DTD-derived syntax and control-reference validation, nested optgroup option ordering, source-order input/select initialization, complete iname/ivalue/name/value/fallback precedence, validated and deduplicated indices, single/multiple user selection, name/iname serialization, exact vdata option values, task-time variable synchronization, HREF-converted onpick dispatch, and direct proof that variable updates do not implicitly refresh other controls. The selected WML-204 tranche is complete; optional tabindex behavior and optgroup capability declaration remain separate and keep this parent row partial.",
  "implementationEvidence": [
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/nodes.rs",
      "symbol": "parse_select_inline_node"
    },
    {
      "path": "engine-wasm/engine/src/engine_runtime_internal/navigation.rs",
      "symbol": "execute_card_task_action"
    },
    {
      "path": "engine-wasm/engine/src/engine_runtime_internal.rs",
      "symbol": "initial_select_indices"
    },
    {
      "path": "engine-wasm/engine/src/engine_runtime_internal.rs",
      "symbol": "sync_select_variables"
    },
    {
      "path": "engine-wasm/engine/src/runtime/variable.rs",
      "symbol": "SubstitutionContext"
    }
  ],
  "testEvidence": [
    {
      "path": "engine-wasm/engine/src/engine_tests/navigation_metadata.rs",
      "test": "focused_select_edit_cycle_commit_updates_render_and_runtime_var",
      "command": "cd engine-wasm/engine && cargo test focused_select_edit_cycle_commit_updates_render_and_runtime_var"
    },
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/tests.rs",
      "test": "wml_fx_select_structure_accepts_declared_control_grammar",
      "command": "cd engine-wasm/engine && cargo test wml_fx_select_structure_accepts_declared_control_grammar"
    },
    {
      "path": "engine-wasm/engine/src/engine_tests/actions_timers.rs",
      "test": "wml_fx_variable_commit_before_task_commits_active_select_before_accept",
      "command": "cd engine-wasm/engine && cargo test wml_fx_variable_commit_before_task_commits_active_select_before_accept"
    },
    {
      "path": "engine-wasm/engine/src/engine_tests/select_semantics.rs",
      "test": "wml_fx_select_default_precedence_covers_every_source_and_fallback",
      "command": "cd engine-wasm/engine && cargo test wml_fx_select_default_precedence_covers_every_source_and_fallback"
    },
    {
      "path": "engine-wasm/engine/src/engine_tests/select_semantics.rs",
      "test": "wml_fx_select_init_order_precedence_validation_and_serialization",
      "command": "cd engine-wasm/engine && cargo test wml_fx_select_init_order_precedence_validation_and_serialization"
    },
    {
      "path": "engine-wasm/engine/src/engine_tests/select_semantics.rs",
      "test": "wml_fx_select_variables_are_resynchronized_before_link_task_execution",
      "command": "cd engine-wasm/engine && cargo test wml_fx_select_variables_are_resynchronized_before_link_task_execution"
    },
    {
      "path": "engine-wasm/engine/src/engine_tests/select_semantics.rs",
      "test": "wml_fx_select_variable_updates_do_not_implicitly_refresh_other_controls",
      "command": "cd engine-wasm/engine && cargo test wml_fx_select_variable_updates_do_not_implicitly_refresh_other_controls"
    },
    {
      "path": "engine-wasm/engine/src/engine_tests/select_semantics.rs",
      "test": "wml_204_control_initialization_interleaves_selects_and_inputs_in_document_order",
      "command": "cd engine-wasm/engine && cargo test wml_204_control_initialization_interleaves_selects_and_inputs_in_document_order"
    },
    {
      "path": "engine-wasm/engine/src/engine_tests/select_semantics.rs",
      "test": "wml_204_option_vdata_defaults_to_noesc_and_href_defaults_to_escape",
      "command": "cd engine-wasm/engine && cargo test wml_204_option_vdata_defaults_to_noesc_and_href_defaults_to_escape"
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
