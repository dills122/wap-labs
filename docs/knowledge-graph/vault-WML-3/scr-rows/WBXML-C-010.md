---
id: "scr-row:WBXML-C-010"
key: "WBXML-C-010"
type: "scr-row"
generated: true
slice: "WML-3"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# Encoding default attribute values

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wbxml|wbxml]]
- `planned-by` → [[work-items/WML-307|WML-307]]
- `refines` ← [[clauses/WBXML-CL-DEFAULT-ATTRIBUTES-OMITTED|WBXML-CL-DEFAULT-ATTRIBUTES-OMITTED]]
- `refines` ← [[clauses/WBXML-CL-DEFAULT-ATTRIBUTES-RECONSTRUCTED|WBXML-CL-DEFAULT-ATTRIBUTES-RECONSTRUCTED]]
- `sourced-from` → [[source-documents/WAP-192_105-WBXML|WAP-192_105-WBXML]]

## Data

```json
{
  "family": "wbxml",
  "ordinal": 12,
  "actor": "wbxml-client-decoder",
  "referencedSection": "6.3",
  "specificationStatus": "mandatory",
  "dependencyExpression": {
    "type": "none",
    "scrIds": []
  },
  "sourceAnchor": {
    "documentId": "WAP-192_105-WBXML",
    "staticConformanceSection": "9.2",
    "changeSection": "3.3"
  },
  "disposition": {
    "strict": "required-for-claimed-actor",
    "classCProfile": "required-by-class-c-client-mcf",
    "enhancementMayReplaceStrictBehavior": false
  },
  "reviewState": "source-extracted-class-c-applied-mapping-provisional",
  "implementationStatus": "implemented",
  "evidenceState": "direct-normative-test-linked",
  "assessmentNote": "The decoder reconstructs every default and fixed attribute declared by the selected WML 1.3 DTD and the Service Indication 1.0 indication action default; implied attributes without declared values remain absent as required.",
  "implementationEvidence": [
    {
      "path": "transport-rust/src/wbxml_decoder.rs",
      "symbol": "default_attributes"
    }
  ],
  "testEvidence": [
    {
      "path": "transport-rust/src/tests/wbxml_conformance.rs",
      "test": "transport_wbxml_c_010_default_attribute_fixtures",
      "command": "cd transport-rust && cargo test --lib transport_wbxml_c_010_default_attribute_fixtures",
      "fixture": "transport-rust/tests/fixtures/transport/wbxml_wml13/conformance.json"
    },
    {
      "path": "transport-rust/src/wbxml.rs",
      "test": "wml_307_generic_wbxml_routes_to_non_wml_si_token_table_and_defaults",
      "command": "cd transport-rust && cargo test --lib wml_307_generic_wbxml_routes_to_non_wml_si_token_table_and_defaults"
    }
  ],
  "ownerLayers": [
    "transport-rust"
  ],
  "requirementIds": [
    "RQ-RMK-007",
    "RQ-RMK-010"
  ],
  "matrixWorkItems": [
    "WML-307"
  ],
  "workItems": [
    "C5-06",
    "R0-08",
    "WML-203",
    "WML-307"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-wbxml-scr.json"
}
```
