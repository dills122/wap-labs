---
id: "scr-row:WML-C-33"
key: "WML-C-33"
type: "scr-row"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# input

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wml|wml]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `planned-by` → [[work-items/WML-204|WML-204]]
- `refines` ← [[clauses/WML-CL-INPUT-EMPTY-COMMIT|WML-CL-INPUT-EMPTY-COMMIT]]
- `refines` ← [[clauses/WML-CL-INPUT-FORMAT-LITERALS|WML-CL-INPUT-FORMAT-LITERALS]]
- `refines` ← [[clauses/WML-CL-INPUT-INITIALIZATION|WML-CL-INPUT-INITIALIZATION]]
- `refines` ← [[clauses/WML-CL-INPUT-INVALID-INITIAL-VALUE|WML-CL-INPUT-INVALID-INITIAL-VALUE]]
- `refines` ← [[clauses/WML-CL-INPUT-MASK-COMMIT|WML-CL-INPUT-MASK-COMMIT]]
- `refines` ← [[clauses/WML-CL-INPUT-MAXLENGTH|WML-CL-INPUT-MAXLENGTH]]
- `refines` ← [[clauses/WML-CL-INPUT-PASSWORD-DISPLAY|WML-CL-INPUT-PASSWORD-DISPLAY]]
- `refines` ← [[clauses/WML-CL-INPUT-REJECTION-ATOMICITY|WML-CL-INPUT-REJECTION-ATOMICITY]]
- `refines` ← [[clauses/WML-CL-INPUT-STRUCTURE|WML-CL-INPUT-STRUCTURE]]
- `refines` ← [[clauses/WML-CL-SELECT-INIT-ORDER|WML-CL-SELECT-INIT-ORDER]]
- `refines` ← [[clauses/WML-CL-VARIABLE-COMMIT-BEFORE-TASK|WML-CL-VARIABLE-COMMIT-BEFORE-TASK]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]

## Data

```json
{
  "family": "wml",
  "ordinal": 33,
  "actor": "wml-user-agent",
  "referencedSection": "11.6.3",
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
  "assessmentNote": "Input now has deterministic DTD-derived syntax validation, Basic Latin format-mask and emptyok enforcement at commit, maxlength enforcement, and name/value initialization interleaved with select controls in document order. Control-scoped vdata references validate and evaluate with exact CDATA, literal-dollar, undefined-variable, case-sensitive-name, and conversion semantics; invalid masks fall back to *M; invalid existing/default values follow unset/fallback rules; rejected commits preserve the prior variable and active draft for retry. The selected WML-204 tranche is complete; language-aware non-Basic-Latin mask repertoires and broader title/accesskey presentation semantics keep this parent row partial.",
  "implementationEvidence": [
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/nodes.rs",
      "symbol": "parse_input_inline_node"
    },
    {
      "path": "engine-wasm/engine/src/runtime/input_mask.rs",
      "symbol": "InputMask"
    },
    {
      "path": "engine-wasm/engine/src/runtime/variable.rs",
      "symbol": "SubstitutionContext"
    },
    {
      "path": "engine-wasm/engine/src/engine_runtime_internal.rs",
      "symbol": "commit_focused_input_edit_internal"
    },
    {
      "path": "engine-wasm/engine/src/engine_runtime_internal.rs",
      "symbol": "initialize_controls_on_active_card"
    }
  ],
  "testEvidence": [
    {
      "path": "engine-wasm/engine/src/engine_tests/navigation_metadata.rs",
      "test": "focused_input_edit_commit_updates_render_and_runtime_var",
      "command": "cd engine-wasm/engine && cargo test focused_input_edit_commit_updates_render_and_runtime_var"
    },
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/tests.rs",
      "test": "wml_fx_input_structure_rejects_invalid_syntax_deterministically",
      "command": "cd engine-wasm/engine && cargo test wml_fx_input_structure_rejects_invalid_syntax_deterministically"
    },
    {
      "path": "engine-wasm/engine/src/engine_tests/navigation_metadata.rs",
      "test": "wml_fx_input_mask_commit_preserves_literals_and_rejection_is_atomic",
      "command": "cd engine-wasm/engine && cargo test wml_fx_input_mask_commit_preserves_literals_and_rejection_is_atomic"
    },
    {
      "path": "engine-wasm/engine/src/engine_tests/navigation_metadata.rs",
      "test": "wml_fx_input_empty_commit_applies_format_and_emptyok_precedence",
      "command": "cd engine-wasm/engine && cargo test wml_fx_input_empty_commit_applies_format_and_emptyok_precedence"
    },
    {
      "path": "engine-wasm/engine/src/engine_tests/navigation_metadata.rs",
      "test": "invalid_input_format_is_ignored_in_favor_of_default_mask",
      "command": "cd engine-wasm/engine && cargo test invalid_input_format_is_ignored_in_favor_of_default_mask"
    },
    {
      "path": "engine-wasm/engine/src/engine_tests/navigation_metadata.rs",
      "test": "wml_fx_input_initialization_prefers_existing_valid_name_value",
      "command": "cd engine-wasm/engine && cargo test wml_fx_input_initialization_prefers_existing_valid_name_value"
    },
    {
      "path": "engine-wasm/engine/src/engine_tests/navigation_metadata.rs",
      "test": "wml_fx_input_invalid_initial_value_unsets_name_and_uses_valid_default",
      "command": "cd engine-wasm/engine && cargo test wml_fx_input_invalid_initial_value_unsets_name_and_uses_valid_default"
    },
    {
      "path": "engine-wasm/engine/src/engine_tests/navigation_metadata.rs",
      "test": "wml_fx_input_initialization_evaluates_vdata_default_in_document_order",
      "command": "cd engine-wasm/engine && cargo test wml_fx_input_initialization_evaluates_vdata_default_in_document_order"
    },
    {
      "path": "engine-wasm/engine/src/engine_tests/navigation_metadata.rs",
      "test": "wml_fx_input_maxlength_limits_draft_and_committed_value",
      "command": "cd engine-wasm/engine && cargo test wml_fx_input_maxlength_limits_draft_and_committed_value"
    },
    {
      "path": "engine-wasm/engine/src/engine_tests/navigation_metadata.rs",
      "test": "wml_fx_input_password_display_conceals_entry_and_preserves_variable",
      "command": "cd engine-wasm/engine && cargo test wml_fx_input_password_display_conceals_entry_and_preserves_variable"
    },
    {
      "path": "engine-wasm/engine/src/engine_tests/actions_timers.rs",
      "test": "invalid_masked_input_blocks_task_without_navigation_side_effects",
      "command": "cd engine-wasm/engine && cargo test invalid_masked_input_blocks_task_without_navigation_side_effects"
    },
    {
      "path": "engine-wasm/engine/src/engine_tests/select_semantics.rs",
      "test": "wml_fx_select_init_order_precedence_validation_and_serialization",
      "command": "cd engine-wasm/engine && cargo test wml_fx_select_init_order_precedence_validation_and_serialization"
    },
    {
      "path": "engine-wasm/engine/src/engine_tests/navigation_metadata.rs",
      "test": "wml_204_input_vdata_conversions_preserve_source_variable",
      "command": "cd engine-wasm/engine && cargo test wml_204_input_vdata_conversions_preserve_source_variable"
    },
    {
      "path": "engine-wasm/engine/src/engine_tests/wml_load_errors.rs",
      "test": "wml_204_invalid_control_variable_references_reject_load_atomically",
      "command": "cd engine-wasm/engine && cargo test wml_204_invalid_control_variable_references_reject_load_atomically"
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
