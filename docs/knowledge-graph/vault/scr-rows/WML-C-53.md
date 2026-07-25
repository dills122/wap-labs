---
id: "scr-row:WML-C-53"
key: "WML-C-53"
type: "scr-row"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# wml

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wml|wml]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` ← [[clauses/WML-CL-WML-ROOT-DECK-SCOPE|WML-CL-WML-ROOT-DECK-SCOPE]]
- `refines` ← [[clauses/WML-CL-WML-ROOT-LANGUAGE|WML-CL-WML-ROOT-LANGUAGE]]
- `refines` ← [[clauses/WML-CL-WML-ROOT-STRUCTURE|WML-CL-WML-ROOT-STRUCTURE]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]

## Data

```json
{
  "family": "wml",
  "ordinal": 53,
  "actor": "wml-user-agent",
  "referencedSection": "11.2",
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
  "assessmentNote": "The parser requires a wml root and constructs the ordered deck from its card children.",
  "implementationEvidence": [
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/mod.rs",
      "symbol": "parse_wml"
    }
  ],
  "testEvidence": [
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/tests.rs",
      "test": "rejects_document_without_wml_root",
      "command": "cd engine-wasm/engine && cargo test rejects_document_without_wml_root"
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
