---
id: "scr-row:WML-C-24"
key: "WML-C-24"
type: "scr-row"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# br

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wml|wml]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` ← [[clauses/WML-CL-BR-LINE-BREAK|WML-CL-BR-LINE-BREAK]]
- `refines` ← [[clauses/WML-CL-BR-TABLE-EFFORT|WML-CL-BR-TABLE-EFFORT]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]

## Data

```json
{
  "family": "wml",
  "ordinal": 24,
  "actor": "wml-user-agent",
  "referencedSection": "11.8.4",
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
  "assessmentNote": "Card-level br emits a break (Node::Break), and inline br (nested with text/links/inputs/selects in the same paragraph) now emits a dedicated InlineNode::Break honored by the layout engine as a direct line advance, rather than collapsing to an ordinary whitespace text segment. The prior inline path was a silent no-op, not merely a downgraded break: `wrap_text` returns zero chunks for an all-whitespace segment, so the break neither rendered nor advanced the line.",
  "implementationEvidence": [
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/nodes.rs",
      "symbol": "map_card_level_nodes"
    },
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/nodes.rs",
      "symbol": "map_inline_nodes_recursive"
    },
    {
      "path": "engine-wasm/engine/src/layout/flow_layout.rs",
      "symbol": "layout_card"
    }
  ],
  "testEvidence": [
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/tests.rs",
      "test": "parses_mixed_card_level_content_paths",
      "command": "cd engine-wasm/engine && cargo test parses_mixed_card_level_content_paths"
    },
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/tests.rs",
      "test": "parses_mixed_inline_text_links_break_and_unknown_wrappers",
      "command": "cd engine-wasm/engine && cargo test parses_mixed_inline_text_links_break_and_unknown_wrappers"
    },
    {
      "path": "engine-wasm/engine/src/layout/flow_layout.rs",
      "test": "inline_break_forces_a_hard_line_break_between_segments",
      "command": "cd engine-wasm/engine && cargo test inline_break_forces_a_hard_line_break_between_segments"
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
