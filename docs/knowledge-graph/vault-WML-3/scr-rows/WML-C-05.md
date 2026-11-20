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
- `refines` ← [[clauses/WML-CL-REFERENCE-ENCODING-DETECTION|WML-CL-REFERENCE-ENCODING-DETECTION]]
- `refines` ← [[clauses/WML-CL-REFERENCE-ENTITY-CHARSET|WML-CL-REFERENCE-ENTITY-CHARSET]]
- `refines` ← [[clauses/WML-CL-REFERENCE-TRANSCODING-LOSS|WML-CL-REFERENCE-TRANSCODING-LOSS]]
- `refines` ← [[clauses/WML-CL-REFERENCE-UNICODE-MAPPING|WML-CL-REFERENCE-UNICODE-MAPPING]]
- `refines` ← [[clauses/WML-CL-REFERENCE-WBXML-PRECEDENCE|WML-CL-REFERENCE-WBXML-PRECEDENCE]]

## Data

```json
{
  "family": "wml",
  "referencedSection": "6.1",
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "staticConformanceSection": "15.1.1",
    "changeSection": null
  },
  "implementationStatus": "implemented",
  "ownerLayers": [
    "engine-wasm",
    "transport-rust"
  ],
  "workItems": [
    "R0-01",
    "R0-08",
    "C5-06"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
