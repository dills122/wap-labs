---
id: "scr-row:WMLS-C-110"
key: "WMLS-C-110"
type: "scr-row"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# Fatal error handling

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wmlscript|wmlscript]]
- `planned-by` → [[work-items/WMLS-501|WMLS-501]]
- `planned-by` → [[work-items/WMLS-505|WMLS-505]]
- `refines` ← [[clauses/WMLSCRIPT-CL-FATAL-ABORT-AND-SIGNAL|WMLSCRIPT-CL-FATAL-ABORT-AND-SIGNAL]]
- `refines` ← [[clauses/WMLSCRIPT-CL-FATAL-BYTECODE-ERROR-MATRIX|WMLSCRIPT-CL-FATAL-BYTECODE-ERROR-MATRIX]]
- `refines` ← [[clauses/WMLSCRIPT-CL-FATAL-RESOURCE-ERROR-MATRIX|WMLSCRIPT-CL-FATAL-RESOURCE-ERROR-MATRIX]]
- `refines` ← [[clauses/WMLSCRIPT-CL-INTEGRITY-FAILURE-QUARANTINE|WMLSCRIPT-CL-INTEGRITY-FAILURE-QUARANTINE]]
- `refines` ← [[clauses/WMLSCRIPT-CL-STACK-UNDERFLOW-FATAL|WMLSCRIPT-CL-STACK-UNDERFLOW-FATAL]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]

## Data

```json
{
  "family": "wmlscript",
  "ordinal": 110,
  "actor": "wmlscript-interpreter",
  "referencedSection": "Fatal error handling",
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
  "assessmentNote": "Source-pinned WAP units now prove fatal stack-underflow integrity handling, resource-class stack overflow, invocation abort, stable trace serialization, and recovery. Other chapter 12 fatal cases remain open.",
  "implementationEvidence": [
    {
      "path": "engine-wasm/engine/src/engine_script_types.rs",
      "symbol": "ScriptExecutionOutcome"
    },
    {
      "path": "engine-wasm/engine/src/wavescript/wap_decoder.rs",
      "symbol": "WapDecodeError"
    },
    {
      "path": "engine-wasm/engine/src/engine_runtime_internal.rs",
      "symbol": "execute_wap_script_ref_call"
    }
  ],
  "testEvidence": [
    {
      "path": "engine-wasm/engine/src/engine_tests/script_runtime.rs",
      "test": "vm_trap_error_category_matrix_is_explicit",
      "limitation": "The deterministic local taxonomy is not yet mapped exhaustively to WAP-193 chapter 12 outcomes."
    },
    {
      "path": "engine-wasm/engine/src/engine_tests/script_runtime.rs",
      "test": "registered_wap_dataflow_failures_preserve_error_trace_taxonomy_and_recovery",
      "command": "cargo test --manifest-path engine-wasm/engine/Cargo.toml registered_wap_dataflow_failures_preserve_error_trace_taxonomy_and_recovery",
      "limitation": "Direct evidence for stack underflow/overflow, abort, trace, and recovery only; the remaining fatal matrix is deferred."
    },
    {
      "path": "engine-wasm/engine/src/engine_wasm_bindings_tests.rs",
      "test": "wasm_wmls_501_library_and_dataflow_verification_matches_native",
      "command": "wasm-pack test --node engine-wasm/engine --features wasm-bindings",
      "limitation": "Pins native/WASM serialization parity for the covered fatal stack cases."
    }
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-010"
  ],
  "matrixWorkItems": [
    "WMLS-501"
  ],
  "workItems": [
    "W1-02",
    "W1-06",
    "W1-07",
    "WMLS-501",
    "WMLS-505"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-wmlscript-scr.json"
}
```
