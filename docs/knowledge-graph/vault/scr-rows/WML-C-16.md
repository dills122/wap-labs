---
id: "scr-row:WML-C-16"
key: "WML-C-16"
type: "scr-row"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# Error handling

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wml|wml]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` ← [[clauses/WML-CL-ERROR-ENFORCEMENT|WML-CL-ERROR-ENFORCEMENT]]
- `refines` ← [[clauses/WML-CL-ERROR-NO-INTENT-INFERENCE|WML-CL-ERROR-NO-INTENT-INFERENCE]]
- `refines` ← [[clauses/WML-CL-TASK-FAILURE-ATOMICITY|WML-CL-TASK-FAILURE-ATOMICITY]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]

## Data

```json
{
  "family": "wml",
  "ordinal": 16,
  "actor": "wml-user-agent",
  "referencedSection": "12.3",
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
  "assessmentNote": "Parsing and task failures are surfaced deterministically with rollback in covered paths, but all WML-defined error conditions are not enforced.",
  "implementationEvidence": [
    {
      "path": "engine-wasm/engine/src/engine_runtime_internal/navigation.rs",
      "symbol": "navigate_to_card_internal"
    }
  ],
  "testEvidence": [
    {
      "path": "engine-wasm/engine/src/engine_tests/actions_timers.rs",
      "test": "fixture_accept_failure_rolls_back_and_trace_order_is_deterministic",
      "command": "cd engine-wasm/engine && cargo test fixture_accept_failure_rolls_back_and_trace_order_is_deterministic"
    }
  ],
  "ownerLayers": [
    "engine-wasm",
    "browser"
  ],
  "requirementIds": [
    "RQ-RMK-012"
  ],
  "matrixWorkItems": [
    "WML-201"
  ],
  "workItems": [
    "R0-01",
    "R0-07",
    "WML-201"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-wml-scr.json"
}
```
