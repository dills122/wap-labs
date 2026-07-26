---
id: "scr-row:WML-C-11"
key: "WML-C-11"
type: "scr-row"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# Initialisation (newcontext)

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wml|wml]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` ← [[clauses/WML-CL-CARD-CONTEXT-ATTRIBUTE|WML-CL-CARD-CONTEXT-ATTRIBUTE]]
- `refines` ← [[clauses/WML-CL-NEWCONTEXT-CLEAR-HISTORY|WML-CL-NEWCONTEXT-CLEAR-HISTORY]]
- `refines` ← [[clauses/WML-CL-NEWCONTEXT-GO-ONLY|WML-CL-NEWCONTEXT-GO-ONLY]]
- `refines` ← [[clauses/WML-CL-NEWCONTEXT-RESET-PRIVATE-STATE|WML-CL-NEWCONTEXT-RESET-PRIVATE-STATE]]
- `refines` ← [[clauses/WML-CL-NEWCONTEXT-UNSET-VARIABLES|WML-CL-NEWCONTEXT-UNSET-VARIABLES]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]

## Data

```json
{
  "family": "wml",
  "ordinal": 11,
  "actor": "wml-user-agent",
  "referencedSection": "10.2",
  "specificationStatus": "mandatory",
  "dependencyExpression": {
    "type": "none",
    "scrIds": []
  },
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "staticConformanceSection": "15.1.3",
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
  "assessmentNote": "The parser retains the card newcontext flag with its false default. Go traversal into a newcontext card clears variables and navigation history and resets implementation-private entry state atomically; direct host navigation does not apply the flag.",
  "implementationEvidence": [
    {
      "path": "engine-wasm/engine/src/engine_runtime_internal/navigation.rs",
      "symbol": "reset_browser_context_for_newcontext"
    }
  ],
  "testEvidence": [
    {
      "path": "engine-wasm/engine/src/engine_tests/wml_202_residual.rs",
      "test": "wml_202_newcontext_resets_vars_history_and_private_entry_state_only_for_go",
      "command": "cargo test --manifest-path engine-wasm/engine/Cargo.toml wml_202_newcontext_resets_vars_history_and_private_entry_state_only_for_go"
    }
  ],
  "ownerLayers": [
    "engine-wasm",
    "browser"
  ],
  "requirementIds": [
    "RQ-RMK-003"
  ],
  "matrixWorkItems": [
    "WML-201"
  ],
  "workItems": [
    "C5-03",
    "R0-01",
    "R0-03",
    "WML-201"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-wml-scr.json"
}
```
