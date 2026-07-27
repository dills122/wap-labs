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
  "reviewState": "source-extracted-class-c-applied-mapping-provisional",
  "implementationStatus": "partial",
  "evidenceState": "provisional-non-normative-test-linked",
  "assessmentNote": "Related local behavior exists, but the evidence does not yet prove the complete WAP-193 requirement and effective binary format.",
  "implementationEvidence": [
    {
      "path": "engine-wasm/engine/src/engine_script_types.rs",
      "symbol": "ScriptExecutionOutcome"
    }
  ],
  "testEvidence": [
    {
      "path": "engine-wasm/engine/src/engine_tests/script_runtime.rs",
      "test": "vm_trap_error_category_matrix_is_explicit",
      "limitation": "The deterministic local taxonomy is not yet mapped exhaustively to WAP-193 chapter 12 outcomes."
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
    "W1-06",
    "W1-07",
    "WMLS-501",
    "WMLS-505"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-wmlscript-scr.json"
}
```
