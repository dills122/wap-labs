---
id: "scr-row:WMLS-C-091"
key: "WMLS-C-091"
type: "scr-row"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# Bytecode header

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wmlscript|wmlscript]]
- `planned-by` → [[work-items/WMLS-501|WMLS-501]]
- `refines` ← [[clauses/WMLSCRIPT-CL-BYTECODE-HEADER-CODE-SIZE|WMLSCRIPT-CL-BYTECODE-HEADER-CODE-SIZE]]
- `refines` ← [[clauses/WMLSCRIPT-CL-BYTECODE-HEADER-VERSION|WMLSCRIPT-CL-BYTECODE-HEADER-VERSION]]
- `refines` ← [[clauses/WMLSCRIPT-CL-BYTECODE-SECTION-ORDER|WMLSCRIPT-CL-BYTECODE-SECTION-ORDER]]
- `refines` ← [[clauses/WMLSCRIPT-CL-INTEGRITY-CODE-SIZE-CHECK|WMLSCRIPT-CL-INTEGRITY-CODE-SIZE-CHECK]]
- `refines` ← [[clauses/WMLSCRIPT-CL-INTEGRITY-VERSION-CHECK|WMLSCRIPT-CL-INTEGRITY-VERSION-CHECK]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]

## Data

```json
{
  "family": "wmlscript",
  "ordinal": 91,
  "actor": "wmlscript-interpreter",
  "referencedSection": "Bytecode header",
  "specificationStatus": "mandatory",
  "dependencyExpression": {
    "type": "none",
    "scrIds": []
  },
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "staticConformanceSection": "15.2.4"
  },
  "disposition": {
    "strict": "required-for-claimed-actor",
    "classCProfile": "required-by-class-c-client-mcf",
    "enhancementMayReplaceStrictBehavior": false
  },
  "reviewState": "source-extracted-class-c-applied-direct-test-linked",
  "implementationStatus": "partial",
  "evidenceState": "direct-test-linked",
  "assessmentNote": "The WAP-193 decoder directly parses and structurally verifies this binary-format area; WMLS-501 remains in progress because compiled-unit runtime routing and execution closure are deferred.",
  "implementationEvidence": [
    {
      "path": "engine-wasm/engine/src/wavescript/wap_decoder.rs",
      "symbol": "decode_wap_compilation_unit"
    }
  ],
  "testEvidence": [
    {
      "path": "engine-wasm/engine/src/wavescript/wap_decoder.rs",
      "test": "decodes_constant_pragma_function_and_instruction_pools",
      "command": "cargo test --manifest-path engine-wasm/engine/Cargo.toml wap_decoder",
      "limitation": "Direct structural decoder evidence only; it does not claim deferred execution, standard-library-index, stack-dataflow, or host-routing closure."
    },
    {
      "path": "engine-wasm/engine/src/engine_wasm_bindings_tests.rs",
      "test": "wasm_wmls_501_decoder_matches_native_fixture_and_failure_semantics",
      "command": "wasm-pack test --node engine-wasm/engine --features wasm-bindings",
      "limitation": "Pins native/WASM decoder parity without changing the host-visible script execution contract."
    }
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-008"
  ],
  "matrixWorkItems": [
    "WMLS-501"
  ],
  "workItems": [
    "W1-02",
    "WMLS-501"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-wmlscript-scr.json"
}
```
