---
id: "scr-row:WML-C-37"
key: "WML-C-37"
type: "scr-row"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# postfield

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wml|wml]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` ← [[clauses/WML-CL-GO-FORM-URLENCODING|WML-CL-GO-FORM-URLENCODING]]
- `refines` ← [[clauses/WML-CL-GO-SUBMISSION-ORDER|WML-CL-GO-SUBMISSION-ORDER]]
- `refines` ← [[clauses/WML-CL-POSTFIELD-REQUEST-PAIR|WML-CL-POSTFIELD-REQUEST-PAIR]]
- `refines` ← [[clauses/WML-CL-POSTFIELD-STRUCTURE|WML-CL-POSTFIELD-STRUCTURE]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]

## Data

```json
{
  "family": "wml",
  "ordinal": 37,
  "actor": "wml-user-agent",
  "referencedSection": "9.3",
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
  "assessmentNote": "Postfield name/value collection and URL-form payload generation exist, but complete variable-conversion, ordering, and task-failure semantics are not closed.",
  "implementationEvidence": [
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/actions.rs",
      "symbol": "collect_post_fields_xml"
    }
  ],
  "testEvidence": [
    {
      "path": "engine-wasm/engine/src/engine_tests/actions_timers.rs",
      "test": "enter_accept_post_action_sets_external_navigation_post_context",
      "command": "cd engine-wasm/engine && cargo test enter_accept_post_action_sets_external_navigation_post_context"
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
    "R0-06",
    "WML-201"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-wml-scr.json"
}
```
