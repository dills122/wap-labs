---
id: "work-item:WMLS-502"
key: "WMLS-502"
type: "work-item"
generated: true
slice: "WMLS-5"
status: "todo"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/work-item"
---

# Language operation and conversion parity

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `contains` ← [[sprints/WMLS-5|WMLS-5]]
- `covers-family` → [[source-families/wmlscript|wmlscript]]
- `owned-by` → [[owner-layers/engine-wasm|engine-wasm]]
- `owned-by` → [[owner-layers/qa|qa]]
- `planned-by` ← [[clauses/WAE-CL-WMLSCRIPT-LANGUAGE-DELEGATE|WAE-CL-WMLSCRIPT-LANGUAGE-DELEGATE]]
- `planned-by` ← [[clauses/WMLSCRIPT-CL-ARGUMENT-CALL-INITIALIZATION|WMLSCRIPT-CL-ARGUMENT-CALL-INITIALIZATION]]
- `planned-by` ← [[clauses/WMLSCRIPT-CL-ARGUMENT-STACK-ORDER|WMLSCRIPT-CL-ARGUMENT-STACK-ORDER]]
- `planned-by` ← [[clauses/WMLSCRIPT-CL-ARGUMENT-VARIABLE-INDEXES|WMLSCRIPT-CL-ARGUMENT-VARIABLE-INDEXES]]
- `planned-by` ← [[clauses/WMLSCRIPT-CL-ARITHMETIC-INVALID-RESULTS|WMLSCRIPT-CL-ARITHMETIC-INVALID-RESULTS]]
- `planned-by` ← [[clauses/WMLSCRIPT-CL-AUTOMATIC-EMPTY-RETURN|WMLSCRIPT-CL-AUTOMATIC-EMPTY-RETURN]]
- `planned-by` ← [[clauses/WMLSCRIPT-CL-BITWISE-INTEGER-RESULTS|WMLSCRIPT-CL-BITWISE-INTEGER-RESULTS]]
- `planned-by` ← [[clauses/WMLSCRIPT-CL-COMPARISON-INVALID-RESULT|WMLSCRIPT-CL-COMPARISON-INVALID-RESULT]]
- `planned-by` ← [[clauses/WMLSCRIPT-CL-CONVERSION-BOOLEAN-MATRIX|WMLSCRIPT-CL-CONVERSION-BOOLEAN-MATRIX]]
- `planned-by` ← [[clauses/WMLSCRIPT-CL-CONVERSION-INTEGER-MATRIX|WMLSCRIPT-CL-CONVERSION-INTEGER-MATRIX]]
- `planned-by` ← [[clauses/WMLSCRIPT-CL-CONVERSION-INTEGER-STRING-GRAMMAR|WMLSCRIPT-CL-CONVERSION-INTEGER-STRING-GRAMMAR]]
- `planned-by` ← [[clauses/WMLSCRIPT-CL-CONVERSION-INVALID-PROHIBITED|WMLSCRIPT-CL-CONVERSION-INVALID-PROHIBITED]]
- `planned-by` ← [[clauses/WMLSCRIPT-CL-CONVERSION-INVALID-PROPAGATION|WMLSCRIPT-CL-CONVERSION-INVALID-PROPAGATION]]
- `planned-by` ← [[clauses/WMLSCRIPT-CL-CONVERSION-STRING-MATRIX|WMLSCRIPT-CL-CONVERSION-STRING-MATRIX]]
- `planned-by` ← [[clauses/WMLSCRIPT-CL-CONVERSION-STRING-NUMERIC-GRAMMAR|WMLSCRIPT-CL-CONVERSION-STRING-NUMERIC-GRAMMAR]]
- `planned-by` ← [[clauses/WMLSCRIPT-CL-CONVERSION-SUMMARY-MATRIX|WMLSCRIPT-CL-CONVERSION-SUMMARY-MATRIX]]
- `planned-by` ← [[clauses/WMLSCRIPT-CL-LOCAL-EMPTY-INITIALIZATION|WMLSCRIPT-CL-LOCAL-EMPTY-INITIALIZATION]]
- `planned-by` ← [[clauses/WMLSCRIPT-CL-LOCAL-VARIABLE-INDEXES|WMLSCRIPT-CL-LOCAL-VARIABLE-INDEXES]]
- `planned-by` ← [[clauses/WMLSCRIPT-CL-LOGICAL-BOOLEAN-CONVERSION|WMLSCRIPT-CL-LOGICAL-BOOLEAN-CONVERSION]]
- `planned-by` ← [[clauses/WMLSCRIPT-CL-NONFATAL-CONVERSION-MATRIX|WMLSCRIPT-CL-NONFATAL-CONVERSION-MATRIX]]
- `planned-by` ← [[clauses/WMLSCRIPT-CL-OPERATOR-CONVERSION-ATOMICITY|WMLSCRIPT-CL-OPERATOR-CONVERSION-ATOMICITY]]
- `planned-by` ← [[clauses/WMLSCRIPT-CL-OPERATOR-CONVERSION-ORDER|WMLSCRIPT-CL-OPERATOR-CONVERSION-ORDER]]
- `planned-by` ← [[clauses/WMLSCRIPT-CL-OPERATOR-CONVERSION-RESULT-INVALID|WMLSCRIPT-CL-OPERATOR-CONVERSION-RESULT-INVALID]]
- `planned-by` ← [[clauses/WMLSCRIPT-CL-OPERATOR-NUMERIC-PRECEDENCE|WMLSCRIPT-CL-OPERATOR-NUMERIC-PRECEDENCE]]
- `planned-by` ← [[clauses/WMLSCRIPT-CL-RETURN-TOP-LEVEL-BOUNDARY|WMLSCRIPT-CL-RETURN-TOP-LEVEL-BOUNDARY]]
- `planned-by` ← [[scr-rows/WAESpec-C-016|WAESpec-C-016]]
- `planned-by` ← [[scr-rows/WMLS-C-072|WMLS-C-072]]
- `planned-by` ← [[scr-rows/WMLS-C-073|WMLS-C-073]]
- `planned-by` ← [[scr-rows/WMLS-C-075|WMLS-C-075]]
- `planned-by` ← [[scr-rows/WMLS-C-076|WMLS-C-076]]
- `planned-by` ← [[scr-rows/WMLS-C-077|WMLS-C-077]]
- `planned-by` ← [[scr-rows/WMLS-C-083|WMLS-C-083]]
- `planned-by` ← [[scr-rows/WMLS-C-084|WMLS-C-084]]
- `planned-by` ← [[scr-rows/WMLS-C-085|WMLS-C-085]]
- `planned-by` ← [[scr-rows/WMLS-C-086|WMLS-C-086]]
- `relates-to` → [[legacy-tickets/W1-04|W1-04]]

## Data

```json
{
  "status": "todo",
  "ownerLayers": [
    "engine-wasm",
    "qa"
  ],
  "sourceFamilies": [
    "wmlscript"
  ],
  "existingTickets": [
    "W1-04"
  ],
  "outputs": [
    "Language operation and conversion parity"
  ],
  "acceptance": [
    "Types, conversions, operators, calls, locals, return values, control flow, and invalid-operation semantics match the effective specification."
  ],
  "evidence": [
    "cargo test --manifest-path engine-wasm/engine/Cargo.toml"
  ],
  "source": "docs/waves/wap-1.2.1-compliance-program.json"
}
```
