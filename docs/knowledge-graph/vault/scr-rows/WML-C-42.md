---
id: "scr-row:WML-C-42"
key: "WML-C-42"
type: "scr-row"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# refresh

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wml|wml]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` ← [[clauses/WML-CL-REFRESH-ASSIGNMENTS|WML-CL-REFRESH-ASSIGNMENTS]]
- `refines` ← [[clauses/WML-CL-REFRESH-REDISPLAY|WML-CL-REFRESH-REDISPLAY]]
- `refines` ← [[clauses/WML-CL-REFRESH-TIMER-RESTART|WML-CL-REFRESH-TIMER-RESTART]]
- `refines` ← [[clauses/WML-CL-TIMER-REFRESH-RESUME|WML-CL-TIMER-REFRESH-RESUME]]
- `refines` ← [[clauses/WML-CL-VARIABLE-TASK-SNAPSHOT|WML-CL-VARIABLE-TASK-SNAPSHOT]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]

## Data

```json
{
  "family": "wml",
  "ordinal": 42,
  "actor": "wml-user-agent",
  "referencedSection": "9.5.3",
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
  "assessmentNote": "Refresh retains the current card/history and resumes timers, but setvar/substitution and full redisplay semantics remain incomplete.",
  "implementationEvidence": [
    {
      "path": "engine-wasm/engine/src/engine_runtime_internal/navigation.rs",
      "symbol": "CardTaskAction::Refresh"
    }
  ],
  "testEvidence": [
    {
      "path": "engine-wasm/engine/src/engine_tests/actions_timers.rs",
      "test": "enter_accept_refresh_action_keeps_current_card_and_history",
      "command": "cd engine-wasm/engine && cargo test enter_accept_refresh_action_keeps_current_card_and_history"
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
