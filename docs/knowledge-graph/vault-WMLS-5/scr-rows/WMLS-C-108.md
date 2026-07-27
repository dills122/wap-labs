---
id: "scr-row:WMLS-C-108"
key: "WMLS-C-108"
type: "scr-row"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# Runtime validity checks

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wmlscript|wmlscript]]
- `planned-by` → [[work-items/WMLS-501|WMLS-501]]
- `refines` ← [[clauses/WMLSCRIPT-CL-CONSTANT-INSTRUCTION-BOUNDS|WMLSCRIPT-CL-CONSTANT-INSTRUCTION-BOUNDS]]
- `refines` ← [[clauses/WMLSCRIPT-CL-CONTROL-FLOW-TARGETS|WMLSCRIPT-CL-CONTROL-FLOW-TARGETS]]
- `refines` ← [[clauses/WMLSCRIPT-CL-FATAL-BYTECODE-ERROR-MATRIX|WMLSCRIPT-CL-FATAL-BYTECODE-ERROR-MATRIX]]
- `refines` ← [[clauses/WMLSCRIPT-CL-FUNCTION-CALL-INDEX-TYPES|WMLSCRIPT-CL-FUNCTION-CALL-INDEX-TYPES]]
- `refines` ← [[clauses/WMLSCRIPT-CL-RUNTIME-CONSTANT-VALIDITY|WMLSCRIPT-CL-RUNTIME-CONSTANT-VALIDITY]]
- `refines` ← [[clauses/WMLSCRIPT-CL-RUNTIME-FUNCTION-VALIDITY|WMLSCRIPT-CL-RUNTIME-FUNCTION-VALIDITY]]
- `refines` ← [[clauses/WMLSCRIPT-CL-RUNTIME-JUMP-VALIDITY|WMLSCRIPT-CL-RUNTIME-JUMP-VALIDITY]]
- `refines` ← [[clauses/WMLSCRIPT-CL-RUNTIME-STACK-VALIDITY|WMLSCRIPT-CL-RUNTIME-STACK-VALIDITY]]
- `refines` ← [[clauses/WMLSCRIPT-CL-RUNTIME-VARIABLE-VALIDITY|WMLSCRIPT-CL-RUNTIME-VARIABLE-VALIDITY]]
- `refines` ← [[clauses/WMLSCRIPT-CL-VARIABLE-INSTRUCTION-BOUNDS|WMLSCRIPT-CL-VARIABLE-INSTRUCTION-BOUNDS]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]

## Data

```json
{
  "family": "wmlscript",
  "ordinal": 108,
  "actor": "wmlscript-interpreter",
  "referencedSection": "Runtime validity checks",
  "specificationStatus": "mandatory",
  "dependencyExpression": {
    "type": "none",
    "scrIds": []
  },
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "staticConformanceSection": "15.2.6"
  },
  "disposition": {
    "strict": "required-for-claimed-actor",
    "classCProfile": "required-by-class-c-client-mcf",
    "enhancementMayReplaceStrictBehavior": false
  },
  "reviewState": "source-extracted-class-c-applied-direct-test-linked",
  "implementationStatus": "partial",
  "evidenceState": "direct-test-linked",
  "assessmentNote": "The WAP-193 decoder directly enforces compilation-unit integrity and structural reference checks; standard-library indexes, stack dataflow, runtime routing, and execution semantics remain deferred.",
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
    "RQ-WMLS-009"
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
