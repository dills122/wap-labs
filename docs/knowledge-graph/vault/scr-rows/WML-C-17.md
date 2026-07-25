---
id: "scr-row:WML-C-17"
key: "WML-C-17"
type: "scr-row"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# Unknown DTD handling

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wml|wml]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `planned-by` → [[work-items/WML-203|WML-203]]
- `refines` ← [[clauses/WML-CL-UNKNOWN-CONTENT-PRESERVED|WML-CL-UNKNOWN-CONTENT-PRESERVED]]
- `refines` ← [[clauses/WML-CL-UNKNOWN-MARKUP-IGNORED|WML-CL-UNKNOWN-MARKUP-IGNORED]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]

## Data

```json
{
  "family": "wml",
  "ordinal": 17,
  "actor": "wml-user-agent",
  "referencedSection": "12.4",
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
  "implementationStatus": "partial",
  "evidenceState": "direct-test-linked",
  "assessmentNote": "Canonical WML 1.3 and alternate external DTD identities are classified without fetching a DTD; alternate-DTD unknown wrappers and attributes are ignored while recognized child content is retained. Strict prologue-presence enforcement, internal subsets, and full DTD validation remain open.",
  "implementationEvidence": [
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/nodes.rs",
      "symbol": "map_inline_nodes_recursive"
    },
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/xml.rs",
      "symbol": "classify_wml_doctype"
    }
  ],
  "testEvidence": [
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/tests.rs",
      "test": "parses_mixed_inline_text_links_break_and_unknown_wrappers",
      "command": "cd engine-wasm/engine && cargo test parses_mixed_inline_text_links_break_and_unknown_wrappers"
    },
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/tests.rs",
      "test": "wml_203_alternate_doctype_ignores_unknown_markup_and_preserves_known_content",
      "command": "cargo test --manifest-path engine-wasm/engine/Cargo.toml wml_203_alternate_doctype_ignores_unknown_markup_and_preserves_known_content"
    }
  ],
  "ownerLayers": [
    "engine-wasm",
    "browser"
  ],
  "requirementIds": [
    "RQ-RMK-009"
  ],
  "matrixWorkItems": [
    "WML-201"
  ],
  "workItems": [
    "R0-01",
    "R0-07",
    "WML-201",
    "WML-203"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-wml-scr.json"
}
```
