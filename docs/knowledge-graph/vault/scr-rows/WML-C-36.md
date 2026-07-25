---
id: "scr-row:WML-C-36"
key: "WML-C-36"
type: "scr-row"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# p

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wml|wml]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` ← [[clauses/WML-CL-PARAGRAPH-ALIGNMENT-DEFAULT|WML-CL-PARAGRAPH-ALIGNMENT-DEFAULT]]
- `refines` ← [[clauses/WML-CL-PARAGRAPH-EMPTY-IGNORED|WML-CL-PARAGRAPH-EMPTY-IGNORED]]
- `refines` ← [[clauses/WML-CL-PARAGRAPH-MODE-INHERITANCE|WML-CL-PARAGRAPH-MODE-INHERITANCE]]
- `refines` ← [[clauses/WML-CL-PARAGRAPH-NONBREAKING-SPACE|WML-CL-PARAGRAPH-NONBREAKING-SPACE]]
- `refines` ← [[clauses/WML-CL-PARAGRAPH-SIGNIFICANT-BREAK|WML-CL-PARAGRAPH-SIGNIFICANT-BREAK]]
- `refines` ← [[clauses/WML-CL-PARAGRAPH-SOFT-HYPHEN|WML-CL-PARAGRAPH-SOFT-HYPHEN]]
- `refines` ← [[clauses/WML-CL-PARAGRAPH-WRAP-MODE|WML-CL-PARAGRAPH-WRAP-MODE]]
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
  "assessmentNote": "Paragraph grouping and baseline wrapping exist, but align, wrap/nowrap inheritance, nbsp, shy, and horizontal-view behavior are incomplete.",
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
