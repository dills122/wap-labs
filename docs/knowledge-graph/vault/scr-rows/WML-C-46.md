---
id: "scr-row:WML-C-46"
key: "WML-C-46"
type: "scr-row"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# table

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wml|wml]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` ← [[clauses/WML-CL-CARD-TABLE-BOUNDARIES|WML-CL-CARD-TABLE-BOUNDARIES]]
- `refines` ← [[clauses/WML-CL-TABLE-ALIGNMENT-DESIGNATORS|WML-CL-TABLE-ALIGNMENT-DESIGNATORS]]
- `refines` ← [[clauses/WML-CL-TABLE-EXACT-COLUMNS|WML-CL-TABLE-EXACT-COLUMNS]]
- `refines` ← [[clauses/WML-CL-TABLE-LONG-ROW-AGGREGATION|WML-CL-TABLE-LONG-ROW-AGGREGATION]]
- `refines` ← [[clauses/WML-CL-TABLE-NONZERO-GUTTER|WML-CL-TABLE-NONZERO-GUTTER]]
- `refines` ← [[clauses/WML-CL-TABLE-SHORT-ROW-PADDING|WML-CL-TABLE-SHORT-ROW-PADDING]]
- `refines` ← [[clauses/WML-CL-TABLE-STRUCTURE|WML-CL-TABLE-STRUCTURE]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]

## Data

```json
{
  "family": "wml",
  "ordinal": 46,
  "actor": "wml-user-agent",
  "referencedSection": "11.8.5",
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
  "implementationStatus": "partial",
  "evidenceState": "direct-test-linked",
  "assessmentNote": "WML-203 enforces table/tr/td structure and WML-301 now applies card-edge table line breaks. Exact column count, short-row padding, long-row aggregation, alignment designators, and non-zero gutter layout remain planned, so the parent stays partial.",
  "implementationEvidence": [
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/validation.rs",
      "symbol": "validate_content_model"
    },
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/nodes.rs",
      "symbol": "TableBoundaryPlan"
    }
  ],
  "testEvidence": [
    {
      "path": "engine-wasm/engine/src/engine_tests/wml_203_validation.rs",
      "test": "wml_203_invalid_content_model_mutations_are_rejected_deterministically",
      "command": "cd engine-wasm/engine && cargo test wml_203_invalid_content_model_mutations_are_rejected_deterministically"
    },
    {
      "path": "engine-wasm/engine/src/engine_tests/wml_301_context_history.rs",
      "test": "wml_301_card_table_boundaries_render_at_card_edges_and_survive_navigation",
      "command": "cd engine-wasm/engine && cargo test wml_301_card_table_boundaries_render_at_card_edges_and_survive_navigation"
    }
  ],
  "ownerLayers": [
    "engine-wasm",
    "browser"
  ],
  "requirementIds": [
    "RQ-RMK-001"
  ],
  "matrixWorkItems": [
    "WML-201"
  ],
  "workItems": [
    "R0-01",
    "R0-05",
    "WML-201"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-wml-scr.json"
}
```
