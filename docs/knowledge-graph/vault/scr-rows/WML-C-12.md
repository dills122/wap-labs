---
id: "scr-row:WML-C-12"
key: "WML-C-12"
type: "scr-row"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# Variables

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wml|wml]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` ← [[clauses/WML-CL-VARIABLE-COMMIT-BEFORE-TASK|WML-CL-VARIABLE-COMMIT-BEFORE-TASK]]
- `refines` ← [[clauses/WML-CL-VARIABLE-CONVERSION-MODES|WML-CL-VARIABLE-CONVERSION-MODES]]
- `refines` ← [[clauses/WML-CL-VARIABLE-DEFAULT-CONVERSION|WML-CL-VARIABLE-DEFAULT-CONVERSION]]
- `refines` ← [[clauses/WML-CL-VARIABLE-DOLLAR-ESCAPE|WML-CL-VARIABLE-DOLLAR-ESCAPE]]
- `refines` ← [[clauses/WML-CL-VARIABLE-NAME-GRAMMAR|WML-CL-VARIABLE-NAME-GRAMMAR]]
- `refines` ← [[clauses/WML-CL-VARIABLE-PARSE-PRECEDENCE|WML-CL-VARIABLE-PARSE-PRECEDENCE]]
- `refines` ← [[clauses/WML-CL-VARIABLE-REFERENCE-VALIDATION|WML-CL-VARIABLE-REFERENCE-VALIDATION]]
- `refines` ← [[clauses/WML-CL-VARIABLE-SET-DEFINITION|WML-CL-VARIABLE-SET-DEFINITION]]
- `refines` ← [[clauses/WML-CL-VARIABLE-SUBSTITUTION-LOCATIONS|WML-CL-VARIABLE-SUBSTITUTION-LOCATIONS]]
- `refines` ← [[clauses/WML-CL-VARIABLE-TASK-SNAPSHOT|WML-CL-VARIABLE-TASK-SNAPSHOT]]
- `refines` ← [[clauses/WML-CL-VARIABLE-UNDEFINED-EMPTY|WML-CL-VARIABLE-UNDEFINED-EMPTY]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]

## Data

```json
{
  "family": "wml",
  "ordinal": 12,
  "actor": "wml-user-agent",
  "referencedSection": "10.3",
  "specificationStatus": "mandatory",
  "dependencyExpression": {
    "type": "none",
    "scrIds": []
  },
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "staticConformanceSection": "15.1.3",
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
  "assessmentNote": "Runtime variables exist, and active input/select edits commit before card task execution. General PCDATA, vdata, HREF, conversion, escaping, and undefined-value substitution remain incomplete.",
  "implementationEvidence": [
    {
      "path": "engine-wasm/engine/src/engine_public_api.rs",
      "symbol": "set_var"
    },
    {
      "path": "engine-wasm/engine/src/engine_runtime_internal/navigation.rs",
      "symbol": "execute_card_task_action"
    }
  ],
  "testEvidence": [
    {
      "path": "engine-wasm/engine/src/engine_tests/navigation_metadata.rs",
      "test": "focused_input_edit_commit_updates_render_and_runtime_var",
      "command": "cd engine-wasm/engine && cargo test focused_input_edit_commit_updates_render_and_runtime_var"
    },
    {
      "path": "engine-wasm/engine/src/engine_tests/actions_timers.rs",
      "test": "wml_fx_variable_commit_before_task_commits_active_input_before_accept",
      "command": "cd engine-wasm/engine && cargo test wml_fx_variable_commit_before_task_commits_active_input_before_accept"
    }
  ],
  "ownerLayers": [
    "engine-wasm",
    "browser"
  ],
  "requirementIds": [
    "RQ-RMK-003",
    "RQ-RMK-005"
  ],
  "matrixWorkItems": [
    "WML-201"
  ],
  "workItems": [
    "R0-01",
    "R0-03",
    "WML-201"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-wml-scr.json"
}
```
