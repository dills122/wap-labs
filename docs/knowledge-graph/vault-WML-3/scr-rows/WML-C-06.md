---
id: "scr-row:WML-C-06"
key: "WML-C-06"
type: "scr-row"
generated: true
slice: "WML-3"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# Character entities

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wml|wml]]
- `planned-by` → [[work-items/WML-307|WML-307]]
- `refines` ← [[clauses/WML-CL-ENTITY-FORMS|WML-CL-ENTITY-FORMS]]
- `refines` ← [[clauses/WML-CL-ENTITY-REQUIRED-NAMES|WML-CL-ENTITY-REQUIRED-NAMES]]
- `refines` ← [[clauses/WML-CL-ENTITY-UNICODE-IDENTITY|WML-CL-ENTITY-UNICODE-IDENTITY]]
- `refines` ← [[clauses/WML-CL-PARAGRAPH-NONBREAKING-SPACE|WML-CL-PARAGRAPH-NONBREAKING-SPACE]]
- `refines` ← [[clauses/WML-CL-PARAGRAPH-SOFT-HYPHEN|WML-CL-PARAGRAPH-SOFT-HYPHEN]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]

## Data

```json
{
  "family": "wml",
  "ordinal": 6,
  "actor": "wml-user-agent",
  "referencedSection": "6.2",
  "specificationStatus": "mandatory",
  "dependencyExpression": {
    "type": "none",
    "scrIds": []
  },
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "staticConformanceSection": "15.1.1",
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
  "assessmentNote": "The parser resolves all seven required WML named entities plus decimal and hexadecimal references against Unicode, rejects unknown or XML-invalid references, preserves non-breaking spaces, and exposes soft hyphens to deterministic layout semantics.",
  "implementationEvidence": [
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/xml.rs",
      "symbol": "decode_general_entity"
    }
  ],
  "testEvidence": [
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/tests.rs",
      "test": "wml_307_decodes_named_decimal_and_hex_entities_as_unicode",
      "command": "cd engine-wasm/engine && cargo test wml_307_decodes_named_decimal_and_hex_entities_as_unicode"
    },
    {
      "path": "engine-wasm/engine/src/layout/flow_layout.rs",
      "test": "wml_307_soft_hyphen_only_renders_when_selected_as_a_break",
      "command": "cd engine-wasm/engine && cargo test wml_307_soft_hyphen_only_renders_when_selected_as_a_break"
    },
    {
      "path": "engine-wasm/examples/source/wml-307-character-processing.flow.json",
      "test": "unicode-entities-and-line-break-characters",
      "command": "pnpm test:story WML-307"
    }
  ],
  "ownerLayers": [
    "engine-wasm",
    "transport-rust"
  ],
  "requirementIds": [
    "RQ-RMK-001",
    "RQ-WAE-012"
  ],
  "matrixWorkItems": [
    "WML-307"
  ],
  "workItems": [
    "C5-06",
    "R0-01",
    "R0-08",
    "WML-307"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-wml-scr.json"
}
```
