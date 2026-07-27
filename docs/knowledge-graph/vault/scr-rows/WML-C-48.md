---
id: "scr-row:WML-C-48"
key: "WML-C-48"
type: "scr-row"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# timer

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wml|wml]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` ← [[clauses/WML-CL-GO-TIMER-THEN-DISPLAY|WML-CL-GO-TIMER-THEN-DISPLAY]]
- `refines` ← [[clauses/WML-CL-REFRESH-TIMER-RESTART|WML-CL-REFRESH-TIMER-RESTART]]
- `refines` ← [[clauses/WML-CL-TIMER-EVENT-TRANSITION|WML-CL-TIMER-EVENT-TRANSITION]]
- `refines` ← [[clauses/WML-CL-TIMER-INITIAL-VALUE-PRECEDENCE|WML-CL-TIMER-INITIAL-VALUE-PRECEDENCE]]
- `refines` ← [[clauses/WML-CL-TIMER-INVALID-VALUE|WML-CL-TIMER-INVALID-VALUE]]
- `refines` ← [[clauses/WML-CL-TIMER-NAME-PERSISTENCE|WML-CL-TIMER-NAME-PERSISTENCE]]
- `refines` ← [[clauses/WML-CL-TIMER-REFRESH-RESUME|WML-CL-TIMER-REFRESH-RESUME]]
- `refines` ← [[clauses/WML-CL-TIMER-SINGLE-PER-CARD|WML-CL-TIMER-SINGLE-PER-CARD]]
- `refines` ← [[clauses/WML-CL-TIMER-START-STOP|WML-CL-TIMER-START-STOP]]
- `refines` ← [[clauses/WML-CL-TIMER-UNITS|WML-CL-TIMER-UNITS]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]

## Data

```json
{
  "family": "wml",
  "ordinal": 48,
  "actor": "wml-user-agent",
  "referencedSection": "11.7",
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
  "assessmentNote": "WML-305 closes the native timer lifecycle: one timer per card, variable-precedence initialization, tenths units, invalid and zero disabling, entry start, exit persistence and stop, refresh stop-update-resume, start-before-display ordering, one-to-zero ontimer dispatch, rollback, and exact target-neutral host wakeups.",
  "implementationEvidence": [
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/actions.rs",
      "symbol": "parse_timer_xml"
    },
    {
      "path": "engine-wasm/engine/src/engine_runtime_internal/timers.rs",
      "symbol": "advance_time_ms_internal"
    },
    {
      "path": "engine-wasm/engine/src/engine_public_api.rs",
      "symbol": "next_timer_wakeup_ms"
    },
    {
      "path": "browser/frontend/src/app/engine-timer-runtime.ts",
      "symbol": "scheduleNextWakeup"
    }
  ],
  "testEvidence": [
    {
      "path": "engine-wasm/engine/src/engine_tests/wml_305_timers.rs",
      "test": "wml_305_dispatches_only_when_positive_timer_transitions_to_zero",
      "command": "cd engine-wasm/engine && cargo test wml_305_dispatches_only_when_positive_timer_transitions_to_zero"
    },
    {
      "path": "engine-wasm/engine/src/engine_wasm_bindings_tests.rs",
      "test": "wasm_wml_305_named_timer_lifecycle_matches_native_boundary",
      "command": "cd engine-wasm/engine && cargo test wasm_wml_305_named_timer_lifecycle_matches_native_boundary"
    },
    {
      "path": "engine-wasm/examples/source/wml-305-timer-lifecycle.flow.json",
      "test": "WML-305 executable stories",
      "command": "pnpm test:story WML-305"
    },
    {
      "path": "browser/frontend/src/app/engine-timer-runtime.test.ts",
      "test": "schedules only the exact native timer wakeup and stops it cleanly",
      "command": "pnpm --dir browser/frontend test -- engine-timer-runtime.test.ts"
    }
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-RMK-001",
    "RQ-RMK-004"
  ],
  "matrixWorkItems": [
    "WML-201"
  ],
  "workItems": [
    "R0-01",
    "R0-04",
    "WML-201",
    "WML-305"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-wml-scr.json"
}
```
