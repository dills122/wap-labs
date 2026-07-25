---
id: "scr-row:WML-C-18"
key: "WML-C-18"
type: "scr-row"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# Inter-card navigation

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wml|wml]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` ← [[clauses/WML-CL-CARD-ID-FRAGMENT|WML-CL-CARD-ID-FRAGMENT]]
- `refines` ← [[clauses/WML-CL-GO-ACCESS-BEFORE-TRANSITION|WML-CL-GO-ACCESS-BEFORE-TRANSITION]]
- `refines` ← [[clauses/WML-CL-GO-ASSIGNMENT-ORDER|WML-CL-GO-ASSIGNMENT-ORDER]]
- `refines` ← [[clauses/WML-CL-GO-ENTRY-EVENT-PRECEDENCE|WML-CL-GO-ENTRY-EVENT-PRECEDENCE]]
- `refines` ← [[clauses/WML-CL-GO-FRAGMENT-FALLBACK|WML-CL-GO-FRAGMENT-FALLBACK]]
- `refines` ← [[clauses/WML-CL-GO-HISTORY-PUSH|WML-CL-GO-HISTORY-PUSH]]
- `refines` ← [[clauses/WML-CL-GO-SETVAR-SNAPSHOT|WML-CL-GO-SETVAR-SNAPSHOT]]
- `refines` ← [[clauses/WML-CL-GO-TARGET-RESOLUTION|WML-CL-GO-TARGET-RESOLUTION]]
- `refines` ← [[clauses/WML-CL-GO-TIMER-THEN-DISPLAY|WML-CL-GO-TIMER-THEN-DISPLAY]]
- `refines` ← [[clauses/WML-CL-NAVIGATION-REFERENCE-MODEL|WML-CL-NAVIGATION-REFERENCE-MODEL]]
- `refines` ← [[clauses/WML-CL-NEWCONTEXT-GO-ONLY|WML-CL-NEWCONTEXT-GO-ONLY]]
- `refines` ← [[clauses/WML-CL-PREV-ASSIGNMENT-ORDER|WML-CL-PREV-ASSIGNMENT-ORDER]]
- `refines` ← [[clauses/WML-CL-PREV-EMPTY-HISTORY|WML-CL-PREV-EMPTY-HISTORY]]
- `refines` ← [[clauses/WML-CL-PREV-ENTRY-EVENT-PRECEDENCE|WML-CL-PREV-ENTRY-EVENT-PRECEDENCE]]
- `refines` ← [[clauses/WML-CL-REFRESH-ASSIGNMENTS|WML-CL-REFRESH-ASSIGNMENTS]]
- `refines` ← [[clauses/WML-CL-REFRESH-REDISPLAY|WML-CL-REFRESH-REDISPLAY]]
- `refines` ← [[clauses/WML-CL-REFRESH-TIMER-RESTART|WML-CL-REFRESH-TIMER-RESTART]]
- `refines` ← [[clauses/WML-CL-TASK-FAILURE-ATOMICITY|WML-CL-TASK-FAILURE-ATOMICITY]]
- `refines` ← [[clauses/WML-CL-VARIABLE-TASK-SNAPSHOT|WML-CL-VARIABLE-TASK-SNAPSHOT]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]

## Data

```json
{
  "family": "wml",
  "ordinal": 18,
  "actor": "wml-user-agent",
  "referencedSection": "12.5",
  "specificationStatus": "mandatory",
  "dependencyExpression": {
    "type": "none",
    "scrIds": []
  },
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "staticConformanceSection": "15.1.4",
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
  "assessmentNote": "Covered go/prev/noop/refresh and rollback paths are ordered deterministically, but setvar, access, newcontext, fetched-deck, and complete fragment-fallback steps remain open.",
  "implementationEvidence": [
    {
      "path": "engine-wasm/engine/src/engine_runtime_internal/navigation.rs",
      "symbol": "execute_card_task_action"
    }
  ],
  "testEvidence": [
    {
      "path": "engine-wasm/engine/src/engine_tests/actions_timers.rs",
      "test": "fixture_accept_go_trace_order_is_deterministic",
      "command": "cd engine-wasm/engine && cargo test fixture_accept_go_trace_order_is_deterministic"
    }
  ],
  "ownerLayers": [
    "engine-wasm",
    "browser"
  ],
  "requirementIds": [
    "RQ-RMK-003"
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
