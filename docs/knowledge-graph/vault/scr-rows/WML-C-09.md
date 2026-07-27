---
id: "scr-row:WML-C-09"
key: "WML-C-09"
type: "scr-row"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# Intrinsic Events

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wml|wml]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` ← [[clauses/WML-CL-GO-ENTRY-EVENT-PRECEDENCE|WML-CL-GO-ENTRY-EVENT-PRECEDENCE]]
- `refines` ← [[clauses/WML-CL-INTRINSIC-ATTRIBUTE-EQUIVALENCE|WML-CL-INTRINSIC-ATTRIBUTE-EQUIVALENCE]]
- `refines` ← [[clauses/WML-CL-INTRINSIC-CARD-OVERRIDES-TEMPLATE|WML-CL-INTRINSIC-CARD-OVERRIDES-TEMPLATE]]
- `refines` ← [[clauses/WML-CL-INTRINSIC-CONFLICT-ERROR|WML-CL-INTRINSIC-CONFLICT-ERROR]]
- `refines` ← [[clauses/WML-CL-INTRINSIC-EVENT-TYPES|WML-CL-INTRINSIC-EVENT-TYPES]]
- `refines` ← [[clauses/WML-CL-INTRINSIC-ILLEGAL-PARENT|WML-CL-INTRINSIC-ILLEGAL-PARENT]]
- `refines` ← [[clauses/WML-CL-INTRINSIC-SCOPE|WML-CL-INTRINSIC-SCOPE]]
- `refines` ← [[clauses/WML-CL-OPTION-ONPICK-MULTI|WML-CL-OPTION-ONPICK-MULTI]]
- `refines` ← [[clauses/WML-CL-OPTION-ONPICK-SINGLE|WML-CL-OPTION-ONPICK-SINGLE]]
- `refines` ← [[clauses/WML-CL-PREV-ENTRY-EVENT-PRECEDENCE|WML-CL-PREV-ENTRY-EVENT-PRECEDENCE]]
- `refines` ← [[clauses/WML-CL-TIMER-EVENT-TRANSITION|WML-CL-TIMER-EVENT-TRANSITION]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]

## Data

```json
{
  "family": "wml",
  "ordinal": 9,
  "actor": "wml-user-agent",
  "referencedSection": "9.10",
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
  "assessmentNote": "Card/template onenterforward, onenterbackward, ontimer, and option onpick bindings have direct action, control, and timer evidence across every nested intrinsic-event clause.",
  "implementationEvidence": [
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/actions.rs",
      "symbol": "push_onevent_binding"
    }
  ],
  "testEvidence": [
    {
      "path": "engine-wasm/engine/src/engine_tests/actions_timers.rs",
      "test": "navigate_runs_onenterforward_action",
      "command": "cd engine-wasm/engine && cargo test navigate_runs_onenterforward_action"
    }
  ],
  "ownerLayers": [
    "engine-wasm",
    "browser"
  ],
  "requirementIds": [
    "RQ-RMK-004"
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
