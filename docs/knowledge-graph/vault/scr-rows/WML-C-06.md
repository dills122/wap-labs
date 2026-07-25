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
  "implementationStatus": "partial",
  "evidenceState": "direct-test-linked",
  "assessmentNote": "Named-entity processing is exercised, but the complete decimal/hexadecimal, nbsp, shy, and Unicode entity behavior is not covered.",
  "implementationEvidence": [
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/xml.rs",
      "symbol": "decode_general_entity"
    }
  ],
  "testEvidence": [
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/tests.rs",
      "test": "decodes_entities_and_uses_href_as_fallback_link_text",
      "command": "cd engine-wasm/engine && cargo test decodes_entities_and_uses_href_as_fallback_link_text"
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
    "R0-01",
    "R0-08",
    "WML-201"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-wml-scr.json"
}
```
