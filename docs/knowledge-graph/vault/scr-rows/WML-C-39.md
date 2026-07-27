---
id: "scr-row:WML-C-39"
key: "WML-C-39"
type: "scr-row"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# onevent

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wml|wml]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` ← [[clauses/WML-CL-INTRINSIC-ATTRIBUTE-EQUIVALENCE|WML-CL-INTRINSIC-ATTRIBUTE-EQUIVALENCE]]
- `refines` ← [[clauses/WML-CL-INTRINSIC-ILLEGAL-PARENT|WML-CL-INTRINSIC-ILLEGAL-PARENT]]
- `refines` ← [[clauses/WML-CL-INTRINSIC-SCOPE|WML-CL-INTRINSIC-SCOPE]]
- `refines` ← [[clauses/WML-CL-ONEVENT-SINGLE-TASK|WML-CL-ONEVENT-SINGLE-TASK]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]

## Data

```json
{
  "family": "wml",
  "ordinal": 39,
  "actor": "wml-user-agent",
  "referencedSection": "9.10.1",
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
  "assessmentNote": "Card/template intrinsic and option onpick onevent bindings parse, reject same-scope conflicts, execute with immediate-parent scope and shadowing, and include completed timer lifecycle evidence.",
  "implementationEvidence": [
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/actions.rs",
      "symbol": "push_onevent_binding"
    }
  ],
  "testEvidence": [
    {
      "path": "engine-wasm/engine/src/engine_tests/wml_303_actions.rs",
      "test": "option_onevent_onpick_uses_immediate_scope_and_rejects_attribute_conflict",
      "command": "cd engine-wasm/engine && cargo test option_onevent_onpick_uses_immediate_scope_and_rejects_attribute_conflict"
    }
  ],
  "ownerLayers": [
    "engine-wasm",
    "browser"
  ],
  "requirementIds": [
    "RQ-RMK-002",
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
