---
id: "scr-row:WML-C-06"
key: "WML-C-06"
type: "scr-row"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# Character entities

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wml|wml]]
- `planned-by` → [[work-items/WML-201|WML-201]]
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
  "assessmentNote": "Native and WASM fixtures cover the seven required named entities, decimal and hexadecimal Unicode references, single-pass resolution, and XML 1.0 character rejection in literals and references.",
  "implementationEvidence": [
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/xml.rs",
      "symbol": "parse_xml_document"
    }
  ],
  "testEvidence": [
    {
      "path": "engine-wasm/engine/src/engine_tests/wml_307_text.rs",
      "test": "wml_307_text_encoding_and_entities",
      "command": "cd engine-wasm/engine && cargo test wml_307_text_encoding_and_entities"
    },
    {
      "path": "engine-wasm/engine/src/engine_tests/wml_307_text.rs",
      "test": "wml_307_rejects_invalid_xml_characters",
      "command": "cd engine-wasm/engine && cargo test wml_307_rejects_invalid_xml_characters"
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
    "WML-201"
  ],
  "workItems": [
    "C5-06",
    "R0-01",
    "R0-08",
    "WML-201"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-wml-scr.json"
}
```
