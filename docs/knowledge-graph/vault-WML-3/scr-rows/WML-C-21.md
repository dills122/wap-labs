---
id: "scr-row:WML-C-21"
key: "WML-C-21"
type: "scr-row"
generated: true
slice: "WML-3"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# access

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wml|wml]]
- `planned-by` → [[work-items/WML-306|WML-306]]
- `refines` ← [[clauses/WML-CL-ACCESS-ABSENT-ALLOWS|WML-CL-ACCESS-ABSENT-ALLOWS]]
- `refines` ← [[clauses/WML-CL-ACCESS-COMPONENT-MATCH|WML-CL-ACCESS-COMPONENT-MATCH]]
- `refines` ← [[clauses/WML-CL-ACCESS-DEFAULTS|WML-CL-ACCESS-DEFAULTS]]
- `refines` ← [[clauses/WML-CL-ACCESS-REFERRER-MATCH|WML-CL-ACCESS-REFERRER-MATCH]]
- `refines` ← [[clauses/WML-CL-ACCESS-RELATIVE-PATH|WML-CL-ACCESS-RELATIVE-PATH]]
- `refines` ← [[clauses/WML-CL-ACCESS-SINGLE-ELEMENT|WML-CL-ACCESS-SINGLE-ELEMENT]]
- `refines` ← [[clauses/WML-CL-ACCESS-URL-CASE-RULES|WML-CL-ACCESS-URL-CASE-RULES]]
- `refines` ← [[clauses/WML-CL-DECK-ACCESS-REQUIRED|WML-CL-DECK-ACCESS-REQUIRED]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]

## Data

```json
{
  "family": "wml",
  "ordinal": 21,
  "actor": "wml-user-agent",
  "referencedSection": "11.3.1",
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
  "assessmentNote": "The access element is parsed and retained, its grammar and uniqueness are enforced, and the engine applies defaults, component-aware domain/path matching, relative-path resolution, and URL case rules against the host-supplied referring URI before committing a deck transition. WML-306 adds direct atomic-denial and safe host-presentation evidence; WML-304 separately owns go sendreferer request intent.",
  "implementationEvidence": [
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/head.rs",
      "symbol": "parse_access"
    },
    {
      "path": "engine-wasm/engine/src/runtime/deck.rs",
      "symbol": "allows_referring_uri"
    },
    {
      "path": "browser/frontend/src/app/navigation-state.ts",
      "symbol": "loadTransportUrl"
    }
  ],
  "testEvidence": [
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/tests.rs",
      "test": "wml_202_retains_access_and_ordered_meta_for_the_whole_deck",
      "command": "cd engine-wasm/engine && cargo test wml_202_retains_access_and_ordered_meta_for_the_whole_deck"
    },
    {
      "path": "engine-wasm/engine/src/engine_tests/wml_202_residual.rs",
      "test": "wml_202_access_policy_applies_defaults_components_relative_paths_and_url_case_rules",
      "command": "cd engine-wasm/engine && cargo test wml_202_access_policy_applies_defaults_components_relative_paths_and_url_case_rules"
    },
    {
      "path": "engine-wasm/engine/src/engine_tests/wml_306_policy.rs",
      "test": "wml_306_access_denial_is_atomic_and_unknown_dtd_content_remains_renderable",
      "command": "cd engine-wasm/engine && cargo test wml_306_access_denial_is_atomic_and_unknown_dtd_content_remains_renderable"
    }
  ],
  "ownerLayers": [
    "engine-wasm",
    "browser"
  ],
  "requirementIds": [
    "RQ-RMK-001"
  ],
  "matrixWorkItems": [
    "WML-306"
  ],
  "workItems": [
    "C5-03",
    "R0-01",
    "R0-04",
    "WML-306"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-wml-scr.json"
}
```
