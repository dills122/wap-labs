---
id: "scr-row:WMLS-C-106"
key: "WMLS-C-106"
type: "scr-row"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# Debug instruction

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wmlscript|wmlscript]]
- `planned-by` → [[work-items/WMLS-501|WMLS-501]]
- `planned-by` → [[work-items/WMLS-502|WMLS-502]]
- `refines` ← [[clauses/WMLSCRIPT-CL-DEBUG-INSTRUCTION-MATRIX|WMLSCRIPT-CL-DEBUG-INSTRUCTION-MATRIX]]
- `refines` ← [[clauses/WMLSCRIPT-CL-INTEGRITY-INSTRUCTION-STREAM|WMLSCRIPT-CL-INTEGRITY-INSTRUCTION-STREAM]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]

## Data

```json
{
  "family": "wmlscript",
  "ordinal": 106,
  "actor": "wmlscript-interpreter",
  "referencedSection": "Debug instruction",
  "specificationStatus": "mandatory",
  "dependencyExpression": {
    "type": "none",
    "scrIds": []
  },
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "staticConformanceSection": "15.2.5"
  },
  "disposition": {
    "strict": "required-for-claimed-actor",
    "classCProfile": "required-by-class-c-client-mcf",
    "enhancementMayReplaceStrictBehavior": false
  },
  "reviewState": "source-extracted-class-c-applied-direct-test-linked",
  "implementationStatus": "partial",
  "evidenceState": "direct-test-linked",
  "assessmentNote": "The WAP-193 verifier recognizes this instruction family, validates applicable references, and includes its source stack effect in reachable whole-function dataflow; execution semantics remain deferred.",
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
      "limitation": "Direct strict verifier evidence only; it does not claim deferred opcode execution, URL/access behavior, or complete chapter 12 closure."
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
    "W1-04",
    "W1-05",
    "WMLS-501",
    "WMLS-502"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-wmlscript-scr.json"
}
```
