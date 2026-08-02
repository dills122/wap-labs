---
id: "scr-row:WML-C-16"
key: "WML-C-16"
type: "scr-row"
generated: true
slice: "WML-3"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# Error handling

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wml|wml]]
- `planned-by` → [[work-items/WML-306|WML-306]]
- `refines` ← [[clauses/WML-CL-ERROR-ENFORCEMENT|WML-CL-ERROR-ENFORCEMENT]]
- `refines` ← [[clauses/WML-CL-ERROR-NO-INTENT-INFERENCE|WML-CL-ERROR-NO-INTENT-INFERENCE]]
- `refines` ← [[clauses/WML-CL-TASK-FAILURE-ATOMICITY|WML-CL-TASK-FAILURE-ATOMICITY]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]

## Data

```json
{
  "family": "wml",
  "ordinal": 16,
  "actor": "wml-user-agent",
  "referencedSection": "12.3",
  "specificationStatus": "mandatory",
  "dependencyExpression": {
    "type": "none",
    "scrIds": []
  },
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "staticConformanceSection": "15.1.4",
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
  "assessmentNote": "Strict WML 1.3 loads preserve XML case sensitivity, reject an invalid form of every declared element, enforce the specification-defined literal, length, table, task, event, variable, prologue, and structural error conditions, and publish deterministic diagnostics without replacing the active deck. Host fetch and destination access failures notify the user while preserving the invoking engine state, pending external intent, committed deck session, and history.",
  "implementationEvidence": [
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/validation.rs",
      "symbol": "validate_wml13_document"
    },
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/xml.rs",
      "symbol": "start_to_element"
    },
    {
      "path": "browser/frontend/src/app/navigation-state.ts",
      "symbol": "loadTransportUrl"
    }
  ],
  "testEvidence": [
    {
      "path": "engine-wasm/engine/src/engine_tests/wml_load_errors.rs",
      "test": "wml_205_rejects_an_invalid_form_of_every_declared_wml_element_atomically",
      "command": "cd engine-wasm/engine && cargo test wml_205_rejects_an_invalid_form_of_every_declared_wml_element_atomically"
    },
    {
      "path": "engine-wasm/engine/src/engine_tests/wml_load_errors.rs",
      "test": "wml_205_enforces_case_literal_length_and_cross_attribute_error_conditions",
      "command": "cd engine-wasm/engine && cargo test wml_205_enforces_case_literal_length_and_cross_attribute_error_conditions"
    }
  ],
  "ownerLayers": [
    "engine-wasm",
    "browser"
  ],
  "requirementIds": [
    "RQ-RMK-012"
  ],
  "matrixWorkItems": [
    "WML-306"
  ],
  "workItems": [
    "R0-01",
    "R0-07",
    "WML-306"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-wml-scr.json"
}
```
