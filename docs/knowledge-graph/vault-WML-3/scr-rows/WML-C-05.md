---
id: "scr-row:WML-C-05"
key: "WML-C-05"
type: "scr-row"
generated: true
slice: "WML-3"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# Reference processing

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wml|wml]]
- `planned-by` → [[work-items/WML-307|WML-307]]
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
  "assessmentNote": "The transport applies XML byte-order, declaration, and carrying-protocol charset evidence without consulting in-document meta fields; recognized US-ASCII, ISO-8859-1, Shift_JIS, UTF-8, and UTF-16 input maps strictly to Unicode without replacement-character transcoding. WBXML payloads remain governed by their header and carrying-protocol rules.",
  "implementationEvidence": [
    {
      "path": "transport-rust/src/responses.rs",
      "symbol": "decode_textual_wml_payload"
    },
    {
      "path": "transport-rust/src/wbxml_decoder.rs",
      "symbol": "decode_wbxml_with_charset"
    }
  ],
  "testEvidence": [
    {
      "path": "transport-rust/src/tests/fetch_mapping.rs",
      "test": "transport_map_success_payload_utf16le_textual_wml_maps_ok",
      "command": "cd transport-rust && cargo test --lib transport_map_success_payload_utf16le_textual_wml_maps_ok"
    },
    {
      "path": "transport-rust/src/tests/fetch_mapping.rs",
      "test": "transport_map_success_payload_declared_latin1_maps_every_character_to_unicode",
      "command": "cd transport-rust && cargo test --lib transport_map_success_payload_declared_latin1_maps_every_character_to_unicode"
    },
    {
      "path": "transport-rust/src/tests/fetch_mapping.rs",
      "test": "transport_map_success_payload_external_shift_jis_maps_to_unicode_without_loss",
      "command": "cd transport-rust && cargo test --lib transport_map_success_payload_external_shift_jis_maps_to_unicode_without_loss"
    },
    {
      "path": "transport-rust/src/tests/fetch_mapping.rs",
      "test": "transport_map_success_payload_rejects_lossy_utf8_and_ignores_meta_charset",
      "command": "cd transport-rust && cargo test --lib transport_map_success_payload_rejects_lossy_utf8_and_ignores_meta_charset"
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
