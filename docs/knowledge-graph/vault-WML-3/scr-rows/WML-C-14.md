---
id: "scr-row:WML-C-14"
key: "WML-C-14"
type: "scr-row"
generated: true
slice: "WML-3"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# Deck access control

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wml|wml]]
- `planned-by` → [[work-items/WML-304|WML-304]]
- `refines` ← [[clauses/WML-CL-DECK-ACCESS-REQUIRED|WML-CL-DECK-ACCESS-REQUIRED]]
- `refines` ← [[clauses/WML-CL-GO-REFERER|WML-CL-GO-REFERER]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]

## Data

```json
{
  "family": "wml",
  "ordinal": 14,
  "actor": "wml-user-agent",
  "referencedSection": "12.1",
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
  "assessmentNote": "Deck access domain/path checks are enforced and WML-304 preserves sendreferer opt-in in the request intent; smallest-relative referer transport serialization remains open.",
  "implementationEvidence": [
    {
      "path": "engine-wasm/engine/src/runtime/deck.rs",
      "symbol": "allows_referring_uri"
    },
    {
      "path": "engine-wasm/engine/src/engine_runtime_internal/navigation.rs",
      "symbol": "wml_go_request_policy"
    }
  ],
  "testEvidence": [
    {
      "path": "engine-wasm/engine/src/engine_tests/wml_202_residual.rs",
      "test": "wml_202_access_policy_applies_defaults_components_relative_paths_and_url_case_rules",
      "command": "cd engine-wasm/engine && cargo test wml_202_access_policy_applies_defaults_components_relative_paths_and_url_case_rules"
    },
    {
      "path": "engine-wasm/engine/src/engine_tests/wml_304_request_intent.rs",
      "test": "wml_304_post_intent_carries_request_attributes_without_constructing_multipart",
      "command": "cd engine-wasm/engine && cargo test wml_304_post_intent_carries_request_attributes_without_constructing_multipart"
    }
  ],
  "ownerLayers": [
    "engine-wasm",
    "browser"
  ],
  "requirementIds": [
    "RQ-RMK-011"
  ],
  "matrixWorkItems": [
    "WML-304"
  ],
  "workItems": [
    "R0-01",
    "R0-07",
    "WML-304"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-wml-scr.json"
}
```
