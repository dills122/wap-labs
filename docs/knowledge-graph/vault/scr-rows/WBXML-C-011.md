---
id: "scr-row:WBXML-C-011"
key: "WBXML-C-011"
type: "scr-row"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# Support both the binary token value and the literal value for all tags, attribute names, and attribute values

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wbxml|wbxml]]
- `planned-by` → [[work-items/WML-203|WML-203]]
- `refines` ← [[clauses/WBXML-CL-BINARY-LITERAL-EQUIVALENCE|WBXML-CL-BINARY-LITERAL-EQUIVALENCE]]
- `refines` ← [[clauses/WBXML-CL-EXTERNAL-TOKEN-TYPING|WBXML-CL-EXTERNAL-TOKEN-TYPING]]
- `refines` ← [[clauses/WBXML-CL-LITERAL-NAME-STATE|WBXML-CL-LITERAL-NAME-STATE]]
- `refines` ← [[clauses/WBXML-CL-LITERAL-TAG-FLAGS|WBXML-CL-LITERAL-TAG-FLAGS]]
- `refines` ← [[clauses/WBXML-CL-MIME-TOKEN-TYPING|WBXML-CL-MIME-TOKEN-TYPING]]

## Data

```json
{
  "family": "wbxml",
  "referencedSection": "6.4",
  "sourceAnchor": {
    "documentId": "WAP-192_105-WBXML",
    "staticConformanceSection": "9.3",
    "changeSection": "3.3"
  },
  "implementationStatus": "missing",
  "ownerLayers": [
    "transport-rust"
  ],
  "workItems": [
    "WML-203",
    "R0-08",
    "T0-07"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
