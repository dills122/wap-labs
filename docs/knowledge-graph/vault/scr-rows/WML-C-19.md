---
id: "scr-row:WML-C-19"
key: "WML-C-19"
type: "scr-row"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# a

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wml|wml]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` ← [[clauses/WML-CL-A-GO-EQUIVALENCE|WML-CL-A-GO-EQUIVALENCE]]
- `refines` ← [[clauses/WML-CL-A-NO-NESTING|WML-CL-A-NO-NESTING]]
- `refines` ← [[clauses/WML-CL-A-REQUIRED-TARGET|WML-CL-A-REQUIRED-TARGET]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]

## Data

```json
{
  "family": "wml",
  "ordinal": 19,
  "actor": "wml-user-agent",
  "referencedSection": "9.9",
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
  "assessmentNote": "The a element parses and activates internal/external navigation, but full HREF variable substitution and equivalent-go behavior are incomplete.",
  "implementationEvidence": [
    {
      "path": "engine-wasm/engine/src/parser/wml_parser/nodes.rs",
      "symbol": "map_inline_nodes_recursive"
    }
  ],
  "testEvidence": [
    {
      "path": "engine-wasm/engine/src/engine_tests/navigation_metadata.rs",
      "test": "enter_navigates_to_fragment_card",
      "command": "cd engine-wasm/engine && cargo test enter_navigates_to_fragment_card"
    }
  ],
  "ownerLayers": [
    "engine-wasm",
    "browser"
  ],
  "requirementIds": [
    "RQ-RMK-006"
  ],
  "matrixWorkItems": [
    "WML-201"
  ],
  "workItems": [
    "R0-01",
    "R0-02",
    "WML-201"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-wml-scr.json"
}
```
