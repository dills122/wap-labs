---
id: "scr-row:WML-C-36"
key: "WML-C-36"
type: "scr-row"
generated: true
slice: "WML-3"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# p

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wml|wml]]
- `planned-by` → [[work-items/WML-307|WML-307]]
- `refines` ← [[clauses/WML-CL-PARAGRAPH-NONBREAKING-SPACE|WML-CL-PARAGRAPH-NONBREAKING-SPACE]]
- `refines` ← [[clauses/WML-CL-PARAGRAPH-SOFT-HYPHEN|WML-CL-PARAGRAPH-SOFT-HYPHEN]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]

## Data

```json
{
  "family": "wml",
  "ordinal": 36,
  "actor": "wml-user-agent",
  "referencedSection": "11.8.3",
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
  "assessmentNote": "Paragraph grouping, baseline wrapping, non-breaking-space preservation, and discretionary soft-hyphen rendering are implemented. Alignment, wrap/nowrap inheritance, and the horizontal-view mechanism for non-wrapped lines remain incomplete.",
  "implementationEvidence": [
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/nodes.rs",
      "symbol": "map_card_level_nodes"
    }
  ],
  "testEvidence": [
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/tests.rs",
      "test": "preserves_inline_text_and_link_order_in_paragraph",
      "command": "cd engine-wasm/engine && cargo test preserves_inline_text_and_link_order_in_paragraph"
    },
    {
      "path": "engine-wasm/engine/src/layout/flow_layout.rs",
      "test": "wml_307_nonbreaking_space_is_not_an_inter_word_break_point",
      "command": "cd engine-wasm/engine && cargo test wml_307_nonbreaking_space_is_not_an_inter_word_break_point"
    },
    {
      "path": "engine-wasm/examples/source/wml-307-character-processing.flow.json",
      "test": "unicode-entities-and-line-break-characters",
      "command": "pnpm test:story WML-307"
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
    "WML-307"
  ],
  "workItems": [
    "R0-01",
    "R0-05",
    "WML-307"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-wml-scr.json"
}
```
