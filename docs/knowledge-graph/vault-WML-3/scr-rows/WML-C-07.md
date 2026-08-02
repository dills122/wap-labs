---
id: "scr-row:WML-C-07"
key: "WML-C-07"
type: "scr-row"
generated: true
slice: "WML-3"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# History

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wml|wml]]
- `planned-by` → [[work-items/WML-304|WML-304]]
- `refines` ← [[clauses/WML-CL-GO-HISTORY-PUSH|WML-CL-GO-HISTORY-PUSH]]
- `refines` ← [[clauses/WML-CL-HISTORY-DUPLICATE-PUSH|WML-CL-HISTORY-DUPLICATE-PUSH]]
- `refines` ← [[clauses/WML-CL-HISTORY-ENTRY-FIELDS|WML-CL-HISTORY-ENTRY-FIELDS]]
- `refines` ← [[clauses/WML-CL-HISTORY-EXCLUDES-CONTENT|WML-CL-HISTORY-EXCLUDES-CONTENT]]
- `refines` ← [[clauses/WML-CL-HISTORY-POST-REPLAY|WML-CL-HISTORY-POST-REPLAY]]
- `refines` ← [[clauses/WML-CL-HISTORY-PREV-POP|WML-CL-HISTORY-PREV-POP]]
- `refines` ← [[clauses/WML-CL-HISTORY-RESOLVES-VARIABLES|WML-CL-HISTORY-RESOLVES-VARIABLES]]
- `refines` ← [[clauses/WML-CL-HISTORY-STACK-MODEL|WML-CL-HISTORY-STACK-MODEL]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]

## Data

```json
{
  "family": "wml",
  "ordinal": 7,
  "actor": "wml-user-agent",
  "referencedSection": "9.2",
  "specificationStatus": "mandatory",
  "dependencyExpression": {
    "type": "none",
    "scrIds": []
  },
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "staticConformanceSection": "15.1.2",
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
  "assessmentNote": "WML-301 closes request-shaped ordered history, duplicate access, content exclusion, and context-aware push/pop. WML-304 replays the original typed POST values through the transport boundary when Back must refetch a prior deck.",
  "implementationEvidence": [
    {
      "path": "engine-wasm/engine/src/engine_runtime_internal/navigation.rs",
      "symbol": "navigate_back_internal"
    },
    {
      "path": "browser/frontend/src/session-history.ts",
      "symbol": "cloneRequestPolicy"
    },
    {
      "path": "browser/frontend/src/app/navigation-state.ts",
      "symbol": "navigateBackWithFallback"
    }
  ],
  "testEvidence": [
    {
      "path": "engine-wasm/engine/src/engine_tests/actions_timers.rs",
      "test": "navigate_back_restores_previous_card",
      "command": "cd engine-wasm/engine && cargo test navigate_back_restores_previous_card"
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
    "RQ-RMK-003",
    "RQ-WAE-016"
  ],
  "matrixWorkItems": [
    "WML-304"
  ],
  "workItems": [
    "R0-01",
    "R0-03",
    "WML-304"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-wml-scr.json"
}
```
