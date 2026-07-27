---
id: "scr-row:WMLS-C-069"
key: "WMLS-C-069"
type: "scr-row"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# Interpret WMLScript bytecode

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wmlscript|wmlscript]]
- `planned-by` → [[work-items/WMLS-501|WMLS-501]]
- `refines` ← [[clauses/WMLSCRIPT-CL-ARITHMETIC-INSTRUCTION-MATRIX|WMLSCRIPT-CL-ARITHMETIC-INSTRUCTION-MATRIX]]
- `refines` ← [[clauses/WMLSCRIPT-CL-BITWISE-INSTRUCTION-MATRIX|WMLSCRIPT-CL-BITWISE-INSTRUCTION-MATRIX]]
- `refines` ← [[clauses/WMLSCRIPT-CL-BYTECODE-COMPILATION-UNIT|WMLSCRIPT-CL-BYTECODE-COMPILATION-UNIT]]
- `refines` ← [[clauses/WMLSCRIPT-CL-BYTECODE-SECTION-ORDER|WMLSCRIPT-CL-BYTECODE-SECTION-ORDER]]
- `refines` ← [[clauses/WMLSCRIPT-CL-CHARACTER-SET-NATIVE-EXECUTION|WMLSCRIPT-CL-CHARACTER-SET-NATIVE-EXECUTION]]
- `refines` ← [[clauses/WMLSCRIPT-CL-COMPARISON-INSTRUCTION-MATRIX|WMLSCRIPT-CL-COMPARISON-INSTRUCTION-MATRIX]]
- `refines` ← [[clauses/WMLSCRIPT-CL-CONSTANT-INSTRUCTION-MATRIX|WMLSCRIPT-CL-CONSTANT-INSTRUCTION-MATRIX]]
- `refines` ← [[clauses/WMLSCRIPT-CL-CONTROL-FLOW-INSTRUCTION-MATRIX|WMLSCRIPT-CL-CONTROL-FLOW-INSTRUCTION-MATRIX]]
- `refines` ← [[clauses/WMLSCRIPT-CL-DEBUG-INSTRUCTION-MATRIX|WMLSCRIPT-CL-DEBUG-INSTRUCTION-MATRIX]]
- `refines` ← [[clauses/WMLSCRIPT-CL-FUNCTION-CALL-INSTRUCTION-MATRIX|WMLSCRIPT-CL-FUNCTION-CALL-INSTRUCTION-MATRIX]]
- `refines` ← [[clauses/WMLSCRIPT-CL-INTERPRETER-CALL-RESULT|WMLSCRIPT-CL-INTERPRETER-CALL-RESULT]]
- `refines` ← [[clauses/WMLSCRIPT-CL-INTERPRETER-EXECUTION-STATE|WMLSCRIPT-CL-INTERPRETER-EXECUTION-STATE]]
- `refines` ← [[clauses/WMLSCRIPT-CL-LOGICAL-INSTRUCTION-MATRIX|WMLSCRIPT-CL-LOGICAL-INSTRUCTION-MATRIX]]
- `refines` ← [[clauses/WMLSCRIPT-CL-OPERAND-TYPE-INSTRUCTION-MATRIX|WMLSCRIPT-CL-OPERAND-TYPE-INSTRUCTION-MATRIX]]
- `refines` ← [[clauses/WMLSCRIPT-CL-RETURN-INSTRUCTION-MATRIX|WMLSCRIPT-CL-RETURN-INSTRUCTION-MATRIX]]
- `refines` ← [[clauses/WMLSCRIPT-CL-STACK-INSTRUCTION-MATRIX|WMLSCRIPT-CL-STACK-INSTRUCTION-MATRIX]]
- `refines` ← [[clauses/WMLSCRIPT-CL-VARIABLE-INSTRUCTION-MATRIX|WMLSCRIPT-CL-VARIABLE-INSTRUCTION-MATRIX]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]

## Data

```json
{
  "family": "wmlscript",
  "ordinal": 69,
  "actor": "wmlscript-interpreter",
  "referencedSection": "Interpret WMLScript bytecode",
  "specificationStatus": "mandatory",
  "dependencyExpression": {
    "type": "none",
    "scrIds": []
  },
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "staticConformanceSection": "15.2.1"
  },
  "disposition": {
    "strict": "required-for-claimed-actor",
    "classCProfile": "required-by-class-c-client-mcf",
    "enhancementMayReplaceStrictBehavior": false
  },
  "reviewState": "source-extracted-class-c-applied-mapping-provisional",
  "implementationStatus": "partial",
  "evidenceState": "provisional-non-normative-test-linked",
  "assessmentNote": "Related local behavior exists, but the evidence does not yet prove the complete WAP-193 requirement and effective binary format.",
  "implementationEvidence": [
    {
      "path": "engine-wasm/engine/src/wavescript/decoder.rs",
      "symbol": "decode_compilation_unit_with_limits"
    },
    {
      "path": "engine-wasm/engine/src/wavescript/vm.rs",
      "symbol": "Vm"
    }
  ],
  "testEvidence": [
    {
      "path": "engine-wasm/engine/src/wavescript/decoder.rs",
      "test": "decode_rejects_unknown_opcode",
      "limitation": "The decoder verifies a project-specific nine-opcode skeleton, not the WAP-193 header, pools, multi-byte fields, or instruction encoding."
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
    "W1-05",
    "WMLS-501"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-wmlscript-scr.json"
}
```
