---
id: "scr-row:WML-C-10"
key: "WML-C-10"
type: "scr-row"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# Browser context

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wml|wml]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` ← [[clauses/WML-CL-CONTEXT-SINGLE-SCOPE|WML-CL-CONTEXT-SINGLE-SCOPE]]
- `refines` ← [[clauses/WML-CL-CONTEXT-STATE-MEMBERS|WML-CL-CONTEXT-STATE-MEMBERS]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]

## Data

```json
{
  "family": "wml",
  "ordinal": 10,
  "actor": "wml-user-agent",
  "referencedSection": "10.1",
  "specificationStatus": "mandatory",
  "dependencyExpression": {
    "type": "none",
    "scrIds": []
  },
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "staticConformanceSection": "15.1.3",
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
  "assessmentNote": "WML-301 keeps variables, request-shaped navigation history, and runtime session state in one observable browser-context scope across native and WASM adapters.",
  "implementationEvidence": [
    {
      "path": "engine-wasm/engine/src/lib.rs",
      "symbol": "WmlEngine"
    }
  ],
  "testEvidence": [
    {
      "path": "engine-wasm/engine/src/engine_tests/traces_public_api.rs",
      "test": "m1_02_load_deck_context_public_api_sets_metadata_and_state",
      "command": "cd engine-wasm/engine && cargo test m1_02_load_deck_context_public_api_sets_metadata_and_state"
    }
  ],
  "ownerLayers": [
    "engine-wasm",
    "browser"
  ],
  "requirementIds": [
    "RQ-RMK-003"
  ],
  "matrixWorkItems": [
    "WML-201"
  ],
  "workItems": [
    "R0-01",
    "R0-03",
    "WML-201"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-wml-scr.json"
}
```
