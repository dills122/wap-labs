---
id: "scr-row:WMLS-C-077"
key: "WMLS-C-077"
type: "scr-row"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# Operator data-type conversion rules

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wmlscript|wmlscript]]
- `planned-by` → [[work-items/WMLS-501|WMLS-501]]
- `planned-by` → [[work-items/WMLS-502|WMLS-502]]
- `refines` ← [[clauses/WMLSCRIPT-CL-ARITHMETIC-INVALID-RESULTS|WMLSCRIPT-CL-ARITHMETIC-INVALID-RESULTS]]
- `refines` ← [[clauses/WMLSCRIPT-CL-BITWISE-INTEGER-RESULTS|WMLSCRIPT-CL-BITWISE-INTEGER-RESULTS]]
- `refines` ← [[clauses/WMLSCRIPT-CL-COMPARISON-INVALID-RESULT|WMLSCRIPT-CL-COMPARISON-INVALID-RESULT]]
- `refines` ← [[clauses/WMLSCRIPT-CL-CONVERSION-INVALID-PROPAGATION|WMLSCRIPT-CL-CONVERSION-INVALID-PROPAGATION]]
- `refines` ← [[clauses/WMLSCRIPT-CL-LOGICAL-BOOLEAN-CONVERSION|WMLSCRIPT-CL-LOGICAL-BOOLEAN-CONVERSION]]
- `refines` ← [[clauses/WMLSCRIPT-CL-NONFATAL-CONVERSION-MATRIX|WMLSCRIPT-CL-NONFATAL-CONVERSION-MATRIX]]
- `refines` ← [[clauses/WMLSCRIPT-CL-OPERATOR-CONVERSION-ATOMICITY|WMLSCRIPT-CL-OPERATOR-CONVERSION-ATOMICITY]]
- `refines` ← [[clauses/WMLSCRIPT-CL-OPERATOR-CONVERSION-ORDER|WMLSCRIPT-CL-OPERATOR-CONVERSION-ORDER]]
- `refines` ← [[clauses/WMLSCRIPT-CL-OPERATOR-CONVERSION-RESULT-INVALID|WMLSCRIPT-CL-OPERATOR-CONVERSION-RESULT-INVALID]]
- `refines` ← [[clauses/WMLSCRIPT-CL-OPERATOR-NUMERIC-PRECEDENCE|WMLSCRIPT-CL-OPERATOR-NUMERIC-PRECEDENCE]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]

## Data

```json
{
  "family": "wmlscript",
  "ordinal": 77,
  "actor": "wmlscript-interpreter",
  "referencedSection": "Operator data-type conversion rules",
  "specificationStatus": "mandatory",
  "dependencyExpression": {
    "type": "none",
    "scrIds": []
  },
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "staticConformanceSection": "15.2.2"
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
      "path": "engine-wasm/engine/src/wavescript/stdlib/wmlbrowser.rs",
      "symbol": "coerce_to_string"
    },
    {
      "path": "engine-wasm/engine/src/wavescript/value.rs",
      "symbol": "ScriptValue"
    }
  ],
  "testEvidence": [
    {
      "path": "engine-wasm/engine/src/wavescript/stdlib/wmlbrowser_tests.rs",
      "test": "string_coercion_is_deterministic_for_scalars",
      "limitation": "The test covers a local helper, not the complete WAP-193 conversion table."
    }
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-006",
    "RQ-WMLS-007"
  ],
  "matrixWorkItems": [
    "WMLS-501"
  ],
  "workItems": [
    "W1-04",
    "WMLS-501",
    "WMLS-502"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-wmlscript-scr.json"
}
```
