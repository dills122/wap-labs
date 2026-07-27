---
id: "scr-row:WML-C-38"
key: "WML-C-38"
type: "scr-row"
generated: true
slice: "WML-3"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# prev

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wml|wml]]
- `planned-by` → [[work-items/WML-304|WML-304]]
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
  "implementationStatus": "partial",
  "evidenceState": "direct-test-linked",
  "assessmentNote": "Prev pops request-shaped card history and executes variable assignments and backward-entry behavior; WML-304 retains the remaining POST replay clause.",
  "implementationEvidence": [
    {
      "path": "engine-wasm/engine/src/engine_runtime_internal/navigation.rs",
      "symbol": "CardTaskAction::Prev"
    }
  ],
  "testEvidence": [
    {
      "path": "engine-wasm/engine/src/engine_tests/actions_timers.rs",
      "test": "enter_accept_prev_action_navigates_back_when_history_exists",
      "command": "cd engine-wasm/engine && cargo test enter_accept_prev_action_navigates_back_when_history_exists"
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
    "WML-304"
  ],
  "workItems": [
    "R0-01",
    "R0-02",
    "WML-304"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-wml-scr.json"
}
```
