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
  "implementationStatus": "partial",
  "evidenceState": "direct-test-linked",
  "assessmentNote": "Card timer parsing, lifecycle, expiry, refresh, and rollback paths exist; variable-bound timer value and all specification edge behavior are not closed.",
  "implementationEvidence": [
    {
      "path": "engine-wasm/engine/src/engine_runtime_internal/timers.rs",
      "symbol": "advance_time_ms_internal"
    }
  ],
  "testEvidence": [
    {
      "path": "engine-wasm/engine/src/engine_tests/actions_timers.rs",
      "test": "timer_non_zero_expires_after_deterministic_advance",
      "command": "cd engine-wasm/engine && cargo test timer_non_zero_expires_after_deterministic_advance"
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
    "WML-201"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-wml-scr.json"
}
```
