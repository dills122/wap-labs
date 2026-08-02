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
- `planned-by` → [[work-items/WML-306|WML-306]]
- `refines` ← [[clauses/WML-CL-DECK-ACCESS-REQUIRED|WML-CL-DECK-ACCESS-REQUIRED]]
- `refines` ← [[clauses/WML-CL-GO-ACCESS-BEFORE-TRANSITION|WML-CL-GO-ACCESS-BEFORE-TRANSITION]]
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
  "implementationStatus": "implemented",
  "evidenceState": "direct-test-linked",
  "assessmentNote": "Deck access domain/path checks run before commit, WML-304 preserves sendreferer opt-in in the request intent, and the transport request boundary emits the smallest usable relative referer. WML-306 adds direct atomic-denial and safe host-presentation evidence.",
  "implementationEvidence": [
    {
      "path": "engine-wasm/engine/src/runtime/deck.rs",
      "symbol": "allows_referring_uri"
    },
    {
      "path": "engine-wasm/engine/src/engine_runtime_internal/navigation.rs",
      "symbol": "wml_go_request_policy"
    },
    {
      "path": "transport-rust/src/request_serialization.rs",
      "symbol": "smallest_usable_referer"
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
    },
    {
      "path": "engine-wasm/engine/src/engine_tests/wml_306_policy.rs",
      "test": "wml_306_access_denial_is_atomic_and_unknown_dtd_content_remains_renderable",
      "command": "cd engine-wasm/engine && cargo test wml_306_access_denial_is_atomic_and_unknown_dtd_content_remains_renderable"
    },
    {
      "path": "transport-rust/src/request_serialization/tests.rs",
      "test": "mapped_fixture_is_byte_exact_and_rejects_invalid_combinations",
      "command": "cargo test --manifest-path transport-rust/Cargo.toml mapped_fixture_is_byte_exact_and_rejects_invalid_combinations"
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
    "WML-304",
    "WML-306"
  ],
  "workItems": [
    "R0-01",
    "R0-07",
    "WML-304",
    "WML-306"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-wml-scr.json"
}
```
