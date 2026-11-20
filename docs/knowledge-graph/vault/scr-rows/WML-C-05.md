---
id: "scr-row:WML-C-05"
key: "WML-C-05"
type: "scr-row"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# Reference processing

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wml|wml]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` ← [[clauses/WML-CL-REFERENCE-ENCODING-DETECTION|WML-CL-REFERENCE-ENCODING-DETECTION]]
- `refines` ← [[clauses/WML-CL-REFERENCE-ENTITY-CHARSET|WML-CL-REFERENCE-ENTITY-CHARSET]]
- `refines` ← [[clauses/WML-CL-REFERENCE-TRANSCODING-LOSS|WML-CL-REFERENCE-TRANSCODING-LOSS]]
- `refines` ← [[clauses/WML-CL-REFERENCE-UNICODE-MAPPING|WML-CL-REFERENCE-UNICODE-MAPPING]]
- `refines` ← [[clauses/WML-CL-REFERENCE-WBXML-PRECEDENCE|WML-CL-REFERENCE-WBXML-PRECEDENCE]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]

## Data

```json
{
  "family": "wml",
  "ordinal": 5,
  "actor": "wml-user-agent",
  "referencedSection": "6.1",
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
  "assessmentNote": "Lowband verifies MIME/BOM/XML precedence, lossless Unicode mapping, malformed-byte rejection, and the WBXML charset boundary. Native and WASM render the same document characters across the supported source encodings.",
  "implementationEvidence": [
    {
      "path": "transport-rust/src/responses.rs",
      "symbol": "decode_textual_wml_payload"
    },
    {
      "path": "transport-rust/src/wbxml_decoder.rs",
      "symbol": "decode_wbxml"
    }
  ],
  "testEvidence": [
    {
      "path": "transport-rust/src/tests/fetch_mapping.rs",
      "test": "transport_wml_307_raw_text_encoding",
      "command": "cd transport-rust && cargo test --lib transport_wml_307_raw_text_encoding"
    },
    {
      "path": "transport-rust/src/tests/wbxml_conformance.rs",
      "test": "transport_wbxml_wml_307_historical_charset_fixtures",
      "command": "cd transport-rust && cargo test --lib transport_wbxml_wml_307_historical_charset_fixtures"
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
