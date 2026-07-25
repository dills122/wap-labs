---
id: "scr-row:WML-C-35"
key: "WML-C-35"
type: "scr-row"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# noop

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wml|wml]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` ← [[clauses/WML-CL-NOOP-NO-PROCESSING|WML-CL-NOOP-NO-PROCESSING]]
- `refines` ← [[clauses/WML-CL-SHADOW-NOOP-MASK|WML-CL-SHADOW-NOOP-MASK]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]

## Data

```json
{
  "family": "wml",
  "ordinal": 35,
  "actor": "wml-user-agent",
  "referencedSection": "9.5.4",
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
  "assessmentNote": "Noop is parsed as an inactive task binding and produces no navigation, state mutation, task activation, or task trace.",
  "implementationEvidence": [
    {
      "path": "engine-wasm/engine/src/engine_runtime_internal/navigation.rs",
      "symbol": "CardTaskAction::Noop"
    }
  ],
  "testEvidence": [
    {
      "path": "engine-wasm/engine/src/engine_tests/actions_timers.rs",
      "test": "enter_accept_noop_binding_is_inactive_and_keeps_current_card_and_history",
      "command": "cd engine-wasm/engine && cargo test enter_accept_noop_binding_is_inactive_and_keeps_current_card_and_history"
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
