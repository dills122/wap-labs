---
id: "scr-row:WML-C-30"
key: "WML-C-30"
type: "scr-row"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# head

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wml|wml]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` ← [[clauses/WML-CL-HEAD-DECK-SCOPE|WML-CL-HEAD-DECK-SCOPE]]
- `refines` ← [[clauses/WML-CL-HEAD-STRUCTURE|WML-CL-HEAD-STRUCTURE]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]

## Data

```json
{
  "family": "wml",
  "ordinal": 30,
  "actor": "wml-user-agent",
  "referencedSection": "11.3",
  "specificationStatus": "mandatory",
  "dependencyExpression": {
    "type": "none",
    "scrIds": []
  },
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "staticConformanceSection": "15.1.5",
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
  "assessmentNote": "The parser enforces a single ordered deck-level head with one or more recognized access/meta children and retains both child models as deck-wide state. Unknown markup remains forward-compatible under WML-C-17 and does not satisfy the recognized head content model.",
  "implementationEvidence": [
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/head.rs",
      "symbol": "parse_deck_head"
    }
  ],
  "testEvidence": [
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/tests.rs",
      "test": "wml_202_retains_access_and_ordered_meta_for_the_whole_deck",
      "command": "cd engine-wasm/engine && cargo test wml_202_retains_access_and_ordered_meta_for_the_whole_deck"
    },
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/tests.rs",
      "test": "wml_202_rejects_invalid_head_access_and_meta_structure_deterministically",
      "command": "cd engine-wasm/engine && cargo test wml_202_rejects_invalid_head_access_and_meta_structure_deterministically"
    }
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-RMK-001"
  ],
  "matrixWorkItems": [
    "WML-201"
  ],
  "workItems": [
    "R0-01",
    "R0-04",
    "WML-201"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-wml-scr.json"
}
```
