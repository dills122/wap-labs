---
id: "scr-row:WML-C-38"
key: "WML-C-38"
type: "scr-row"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# prev

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wml|wml]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` ← [[clauses/WML-CL-HISTORY-POST-REPLAY|WML-CL-HISTORY-POST-REPLAY]]
- `refines` ← [[clauses/WML-CL-HISTORY-PREV-POP|WML-CL-HISTORY-PREV-POP]]
- `refines` ← [[clauses/WML-CL-PREV-ASSIGNMENT-ORDER|WML-CL-PREV-ASSIGNMENT-ORDER]]
- `refines` ← [[clauses/WML-CL-PREV-EMPTY-HISTORY|WML-CL-PREV-EMPTY-HISTORY]]
- `refines` ← [[clauses/WML-CL-PREV-ENTRY-EVENT-PRECEDENCE|WML-CL-PREV-ENTRY-EVENT-PRECEDENCE]]
- `refines` ← [[clauses/WML-CL-TASK-FAILURE-ATOMICITY|WML-CL-TASK-FAILURE-ATOMICITY]]
- `refines` ← [[clauses/WML-CL-VARIABLE-TASK-SNAPSHOT|WML-CL-VARIABLE-TASK-SNAPSHOT]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]

## Data

```json
{
  "family": "wml",
  "ordinal": 38,
  "actor": "wml-user-agent",
  "referencedSection": "9.5.2",
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
  "assessmentNote": "Prev pops request-shaped card history, executes variable assignments and backward-entry behavior, and replays typed POST values when the prior deck must be fetched again.",
  "implementationEvidence": [
    {
      "path": "engine-wasm/engine/src/engine_runtime_internal/navigation.rs",
      "symbol": "CardTaskAction::Prev"
    },
    {
      "path": "browser/frontend/src/app/navigation-state.ts",
      "symbol": "navigateBackWithFallback"
    }
  ],
  "testEvidence": [
    {
      "path": "engine-wasm/engine/src/engine_tests/actions_timers.rs",
      "test": "enter_accept_prev_action_navigates_back_when_history_exists",
      "command": "cd engine-wasm/engine && cargo test enter_accept_prev_action_navigates_back_when_history_exists"
    },
    {
      "path": "browser/frontend/src/app/navigation-state.history.test.ts",
      "test": "replays typed POST values when history back must refetch the prior deck",
      "command": "pnpm --dir browser/frontend test -- src/app/navigation-state.history.test.ts src/session-history.test.ts"
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
    "WML-201"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-wml-scr.json"
}
```
