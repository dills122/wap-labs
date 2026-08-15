---
id: "scr-row:WBXML-C-011"
key: "WBXML-C-011"
type: "scr-row"
generated: true
slice: "WML-3"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# Support both the binary token value and the literal value for all tags, attribute names, and attribute values

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wbxml|wbxml]]
- `planned-by` → [[work-items/WML-307|WML-307]]
- `refines` ← [[clauses/WBXML-CL-BINARY-LITERAL-EQUIVALENCE|WBXML-CL-BINARY-LITERAL-EQUIVALENCE]]
- `refines` ← [[clauses/WBXML-CL-EXTERNAL-TOKEN-TYPING|WBXML-CL-EXTERNAL-TOKEN-TYPING]]
- `refines` ← [[clauses/WBXML-CL-LITERAL-NAME-STATE|WBXML-CL-LITERAL-NAME-STATE]]
- `refines` ← [[clauses/WBXML-CL-LITERAL-TAG-FLAGS|WBXML-CL-LITERAL-TAG-FLAGS]]
- `refines` ← [[clauses/WBXML-CL-MIME-TOKEN-TYPING|WBXML-CL-MIME-TOKEN-TYPING]]
- `sourced-from` → [[source-documents/WAP-192_105-WBXML|WAP-192_105-WBXML]]

## Data

```json
{
  "family": "wbxml",
  "ordinal": 15,
  "actor": "wbxml-client-decoder",
  "referencedSection": "6.4",
  "specificationStatus": "mandatory",
  "dependencyExpression": {
    "type": "none",
    "scrIds": []
  },
  "sourceAnchor": {
    "documentId": "WAP-192_105-WBXML",
    "staticConformanceSection": "9.3",
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
  "assessmentNote": "The decoder exhaustively pairs WML 1.3 page-zero tokens with literal forms, adds binary/literal equivalence for the registered Service Indication 1.0 vocabulary, and routes generic application/vnd.wap.wbxml payloads by their internal public identifier while enforcing typed-MIME conflicts.",
  "implementationEvidence": [
    {
      "path": "transport-rust/src/wbxml_decoder.rs",
      "symbol": "attribute_value"
    }
  ],
  "testEvidence": [
    {
      "path": "transport-rust/src/tests/wbxml_conformance.rs",
      "test": "transport_wbxml_c_011_binary_literal_equivalence_fixtures",
      "command": "cd transport-rust && cargo test --lib transport_wbxml_c_011_binary_literal_equivalence_fixtures",
      "fixture": "transport-rust/tests/fixtures/transport/wbxml_wml13/conformance.json"
    },
    {
      "path": "transport-rust/src/tests/wbxml_conformance.rs",
      "test": "transport_wbxml_page_zero_binary_literal_equivalence_is_exhaustive",
      "command": "cd transport-rust && cargo test --lib transport_wbxml_page_zero_binary_literal_equivalence_is_exhaustive",
      "fixture": "transport-rust/tests/fixtures/transport/wbxml_wml13/conformance.json"
    },
    {
      "path": "transport-rust/src/wbxml.rs",
      "test": "wml_307_si_binary_and_literal_tokens_are_equivalent",
      "command": "cd transport-rust && cargo test --lib wml_307_si_binary_and_literal_tokens_are_equivalent"
    },
    {
      "path": "transport-rust/src/tests/fetch_mapping.rs",
      "test": "transport_map_success_payload_generic_wbxml_routes_by_wml_public_identifier",
      "command": "cd transport-rust && cargo test --lib transport_map_success_payload_generic_wbxml_routes_by_wml_public_identifier"
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
    "T0-07",
    "WML-203",
    "WML-307"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-wbxml-scr.json"
}
```
