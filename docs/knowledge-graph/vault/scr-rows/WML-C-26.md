---
id: "scr-row:WML-C-26"
key: "WML-C-26"
type: "scr-row"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# do

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wml|wml]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` ← [[clauses/WML-CL-DO-ACTIVATION|WML-CL-DO-ACTIVATION]]
- `refines` ← [[clauses/WML-CL-DO-ACTIVE-VISIBILITY|WML-CL-DO-ACTIVE-VISIBILITY]]
- `refines` ← [[clauses/WML-CL-DO-EFFECTIVE-NAME|WML-CL-DO-EFFECTIVE-NAME]]
- `refines` ← [[clauses/WML-CL-DO-INACTIVE-HIDDEN|WML-CL-DO-INACTIVE-HIDDEN]]
- `refines` ← [[clauses/WML-CL-DO-LABEL-BEST-EFFORT|WML-CL-DO-LABEL-BEST-EFFORT]]
- `refines` ← [[clauses/WML-CL-DO-OPTIONAL-PERMISSION|WML-CL-DO-OPTIONAL-PERMISSION]]
- `refines` ← [[clauses/WML-CL-DO-STRUCTURE|WML-CL-DO-STRUCTURE]]
- `refines` ← [[clauses/WML-CL-DO-TYPE-ACCEPTANCE|WML-CL-DO-TYPE-ACCEPTANCE]]
- `refines` ← [[clauses/WML-CL-DO-UNIQUE-WIDGET|WML-CL-DO-UNIQUE-WIDGET]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]

## Data

```json
{
  "family": "wml",
  "ordinal": 26,
  "actor": "wml-user-agent",
  "referencedSection": "9.7",
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
  "assessmentNote": "Named do bindings retain type/name/label/optional/language metadata and execute with deterministic card/template precedence; dynamic visibility, labelling, and unique user-interface presentation remain incomplete under WBP-06.",
  "implementationEvidence": [
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/actions.rs",
      "symbol": "push_do_binding"
    }
  ],
  "testEvidence": [
    {
      "path": "engine-wasm/engine/src/engine_tests/wml_303_actions.rs",
      "test": "active_do_order_retains_metadata_effective_identity_and_optional_policy",
      "command": "cd engine-wasm/engine && cargo test active_do_order_retains_metadata_effective_identity_and_optional_policy"
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
