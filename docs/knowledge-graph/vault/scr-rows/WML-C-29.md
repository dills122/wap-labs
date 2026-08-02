---
id: "scr-row:WML-C-29"
key: "WML-C-29"
type: "scr-row"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# go

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wml|wml]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` ← [[clauses/WML-CL-GO-ACCEPT-CHARSET|WML-CL-GO-ACCEPT-CHARSET]]
- `refines` ← [[clauses/WML-CL-GO-ACCESS-BEFORE-TRANSITION|WML-CL-GO-ACCESS-BEFORE-TRANSITION]]
- `refines` ← [[clauses/WML-CL-GO-ASSIGNMENT-ORDER|WML-CL-GO-ASSIGNMENT-ORDER]]
- `refines` ← [[clauses/WML-CL-GO-ENCTYPE-SUPPORT|WML-CL-GO-ENCTYPE-SUPPORT]]
- `refines` ← [[clauses/WML-CL-GO-ENTRY-EVENT-PRECEDENCE|WML-CL-GO-ENTRY-EVENT-PRECEDENCE]]
- `refines` ← [[clauses/WML-CL-GO-FORM-URLENCODING|WML-CL-GO-FORM-URLENCODING]]
- `refines` ← [[clauses/WML-CL-GO-FRAGMENT-FALLBACK|WML-CL-GO-FRAGMENT-FALLBACK]]
- `refines` ← [[clauses/WML-CL-GO-GET-QUERY-MERGE|WML-CL-GO-GET-QUERY-MERGE]]
- `refines` ← [[clauses/WML-CL-GO-HISTORY-PUSH|WML-CL-GO-HISTORY-PUSH]]
- `refines` ← [[clauses/WML-CL-GO-INTERNAL-POSTFIELD-SUPPRESSION|WML-CL-GO-INTERNAL-POSTFIELD-SUPPRESSION]]
- `refines` ← [[clauses/WML-CL-GO-METHOD|WML-CL-GO-METHOD]]
- `refines` ← [[clauses/WML-CL-GO-NO-CACHE|WML-CL-GO-NO-CACHE]]
- `refines` ← [[clauses/WML-CL-GO-PART-CONTENT-TYPE|WML-CL-GO-PART-CONTENT-TYPE]]
- `refines` ← [[clauses/WML-CL-GO-POST-CONTENT-TYPE-CHARSET|WML-CL-GO-POST-CONTENT-TYPE-CHARSET]]
- `refines` ← [[clauses/WML-CL-GO-REFERER|WML-CL-GO-REFERER]]
- `refines` ← [[clauses/WML-CL-GO-SETVAR-SNAPSHOT|WML-CL-GO-SETVAR-SNAPSHOT]]
- `refines` ← [[clauses/WML-CL-GO-STRUCTURE|WML-CL-GO-STRUCTURE]]
- `refines` ← [[clauses/WML-CL-GO-SUBMISSION-ORDER|WML-CL-GO-SUBMISSION-ORDER]]
- `refines` ← [[clauses/WML-CL-GO-TARGET-RESOLUTION|WML-CL-GO-TARGET-RESOLUTION]]
- `refines` ← [[clauses/WML-CL-GO-TIMER-THEN-DISPLAY|WML-CL-GO-TIMER-THEN-DISPLAY]]
- `refines` ← [[clauses/WML-CL-NEWCONTEXT-GO-ONLY|WML-CL-NEWCONTEXT-GO-ONLY]]
- `refines` ← [[clauses/WML-CL-POSTFIELD-REQUEST-PAIR|WML-CL-POSTFIELD-REQUEST-PAIR]]
- `refines` ← [[clauses/WML-CL-TASK-FAILURE-ATOMICITY|WML-CL-TASK-FAILURE-ATOMICITY]]
- `refines` ← [[clauses/WML-CL-VARIABLE-TASK-SNAPSHOT|WML-CL-VARIABLE-TASK-SNAPSHOT]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]

## Data

```json
{
  "family": "wml",
  "ordinal": 29,
  "actor": "wml-user-agent",
  "referencedSection": "9.5.1",
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
  "assessmentNote": "The parser and runtime publish a typed GET/POST request intent with ordered postfields, referer opt-in, no-cache, enctype, charset, and same-deck classification. The transport boundary completes query merge, form-urlencoded and multipart serialization, charset transcoding, origin reload policy, referer emission, and replayable typed POST bodies.",
  "implementationEvidence": [
    {
      "path": "engine-wasm/engine/src/engine_runtime_internal/navigation.rs",
      "symbol": "wml_go_request_policy"
    },
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/actions.rs",
      "symbol": "parse_go_request_xml"
    },
    {
      "path": "transport-rust/src/request_serialization.rs",
      "symbol": "serialize_fetch_request"
    }
  ],
  "testEvidence": [
    {
      "path": "engine-wasm/engine/src/engine_tests/wml_304_request_intent.rs",
      "test": "wml_304_get_intent_preserves_order_without_claiming_query_merge",
      "command": "cd engine-wasm/engine && cargo test wml_304_get_intent_preserves_order_without_claiming_query_merge"
    },
    {
      "path": "engine-wasm/engine/src/engine_tests/wml_304_request_intent.rs",
      "test": "wml_304_post_intent_carries_request_attributes_without_constructing_multipart",
      "command": "cd engine-wasm/engine && cargo test wml_304_post_intent_carries_request_attributes_without_constructing_multipart"
    },
    {
      "path": "transport-rust/src/request_serialization/tests.rs",
      "test": "mapped_fixture_is_byte_exact_and_rejects_invalid_combinations",
      "command": "cd transport-rust && cargo test --lib mapped_fixture_is_byte_exact_and_rejects_invalid_combinations"
    },
    {
      "path": "transport-rust/src/request_serialization/tests.rs",
      "test": "multipart_post_builds_deterministic_typed_parts",
      "command": "cd transport-rust && cargo test --lib multipart_post_builds_deterministic_typed_parts"
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
