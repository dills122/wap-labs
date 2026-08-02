---
id: "scr-row:WML-C-15"
key: "WML-C-15"
type: "scr-row"
generated: true
slice: "WML-3"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# Low-memory behaviour

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wml|wml]]
- `planned-by` → [[work-items/WML-306|WML-306]]
- `refines` ← [[clauses/WML-CL-LOW-MEMORY-CONTEXT-FAILURE-RESET|WML-CL-LOW-MEMORY-CONTEXT-FAILURE-RESET]]
- `refines` ← [[clauses/WML-CL-LOW-MEMORY-CONTEXT-RECLAIM|WML-CL-LOW-MEMORY-CONTEXT-RECLAIM]]
- `refines` ← [[clauses/WML-CL-LOW-MEMORY-HISTORY-LRU|WML-CL-LOW-MEMORY-HISTORY-LRU]]
- `refines` ← [[clauses/WML-CL-LOW-MEMORY-HISTORY-MINIMUM|WML-CL-LOW-MEMORY-HISTORY-MINIMUM]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]

## Data

```json
{
  "family": "wml",
  "ordinal": 15,
  "actor": "wml-user-agent",
  "referencedSection": "12.2",
  "specificationStatus": "optional",
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
    "strict": "declare-implemented-or-deferred",
    "classCProfile": "optional-not-required-by-class-c-client",
    "enhancementMayReplaceStrictBehavior": false
  },
  "reviewState": "source-extracted-class-c-applied-mapping-provisional",
  "implementationStatus": "implemented",
  "evidenceState": "direct-test-linked",
  "assessmentNote": "The optional Class C low-memory capability uses a 32-entry host LRU window (above the recommended minimum of ten), reclaims engine and host history before failure, resets the browser context to an empty predictable state when variable storage remains exhausted, retries the pending task once, and publishes bounded host-owned notification copy.",
  "implementationEvidence": [
    {
      "path": "engine-wasm/engine/src/engine_runtime_internal/navigation.rs",
      "symbol": "execute_card_task_action"
    },
    {
      "path": "browser/frontend/src/session-history.ts",
      "symbol": "HOST_HISTORY_ENTRY_CAPACITY"
    },
    {
      "path": "browser/frontend/src/app/browser-presenter.ts",
      "symbol": "announceRuntimeFailure"
    }
  ],
  "testEvidence": [
    {
      "path": "engine-wasm/engine/src/engine_tests/wml_306_policy.rs",
      "test": "wml_306_low_memory_reclaims_history_resets_context_and_retries_atomically",
      "command": "cd engine-wasm/engine && cargo test wml_306_low_memory_reclaims_history_resets_context_and_retries_atomically"
    },
    {
      "path": "browser/frontend/src/session-history.test.ts",
      "test": "implements the WML-306 optional low-memory history policy as bounded LRU",
      "command": "pnpm --dir browser/frontend test -- src/session-history.test.ts"
    }
  ],
  "ownerLayers": [
    "engine-wasm",
    "browser"
  ],
  "requirementIds": [],
  "matrixWorkItems": [
    "WML-306"
  ],
  "workItems": [
    "R0-01",
    "R0-07",
    "WML-306"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-wml-scr.json"
}
```
