---
id: "scr-row:WMLS-C-085"
key: "WMLS-C-085"
type: "scr-row"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# Automatic function return value

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wmlscript|wmlscript]]
- `planned-by` → [[work-items/WMLS-501|WMLS-501]]
- `planned-by` → [[work-items/WMLS-502|WMLS-502]]
- `refines` ← [[clauses/WMLSCRIPT-CL-AUTOMATIC-EMPTY-RETURN|WMLSCRIPT-CL-AUTOMATIC-EMPTY-RETURN]]
- `refines` ← [[clauses/WMLSCRIPT-CL-RETURN-TOP-LEVEL-BOUNDARY|WMLSCRIPT-CL-RETURN-TOP-LEVEL-BOUNDARY]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]

## Data

```json
{
  "family": "wmlscript",
  "ordinal": 85,
  "actor": "wmlscript-interpreter",
  "referencedSection": "Automatic function return value",
  "specificationStatus": "mandatory",
  "dependencyExpression": {
    "type": "none",
    "scrIds": []
  },
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "staticConformanceSection": "15.2.3"
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
      "path": "engine-wasm/engine/src/wavescript/vm.rs",
      "symbol": "Vm::execute_from_pc_with_locals_and_host"
    }
  ],
  "testEvidence": [
    {
      "path": "engine-wasm/engine/src/wavescript/vm_tests.rs",
      "test": "execute_call_and_return_with_arg_local_flow",
      "limitation": "The project-specific frame model has not been proven against WAP function metadata and exact arity rules."
    }
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-004",
    "RQ-WMLS-005"
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
