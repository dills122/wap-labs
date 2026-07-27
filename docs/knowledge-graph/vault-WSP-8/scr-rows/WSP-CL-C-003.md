---
id: "scr-row:WSP-CL-C-003"
key: "WSP-CL-C-003"
type: "scr-row"
generated: true
slice: "WSP-8"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# Header Encoding

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wsp|wsp]]
- `planned-by` → [[work-items/WSP-802|WSP-802]]
- `refines` ← [[clauses/WSP-CL-EXPECT-SIN-ENCODING|WSP-CL-EXPECT-SIN-ENCODING]]
- `refines` ← [[clauses/WSP-CL-HEADER-CODE-PAGE-RANGES|WSP-CL-HEADER-CODE-PAGE-RANGES]]
- `refines` ← [[clauses/WSP-CL-HEADER-COMPACTION-FORMS|WSP-CL-HEADER-COMPACTION-FORMS]]
- `refines` ← [[clauses/WSP-CL-HEADER-DEFAULT-PAGE|WSP-CL-HEADER-DEFAULT-PAGE]]
- `refines` ← [[clauses/WSP-CL-HEADER-EXTENSION-PAGE-AGREEMENT|WSP-CL-HEADER-EXTENSION-PAGE-AGREEMENT]]
- `refines` ← [[clauses/WSP-CL-HEADER-FIELD-ASSIGNMENTS|WSP-CL-HEADER-FIELD-ASSIGNMENTS]]
- `refines` ← [[clauses/WSP-CL-HEADER-HTTP-COMPATIBILITY|WSP-CL-HEADER-HTTP-COMPATIBILITY]]
- `refines` ← [[clauses/WSP-CL-HEADER-LIST-EXPANSION|WSP-CL-HEADER-LIST-EXPANSION]]
- `refines` ← [[clauses/WSP-CL-HEADER-NAME-VERSION-CHOICE|WSP-CL-HEADER-NAME-VERSION-CHOICE]]
- `refines` ← [[clauses/WSP-CL-HEADER-SYNTAX-REGISTRY|WSP-CL-HEADER-SYNTAX-REGISTRY]]
- `refines` ← [[clauses/WSP-CL-HEADER-UNKNOWN-VALUE-SKIP|WSP-CL-HEADER-UNKNOWN-VALUE-SKIP]]
- `refines` ← [[clauses/WSP-CL-HEADER-VALUE-ENCODING-CHOICE|WSP-CL-HEADER-VALUE-ENCODING-CHOICE]]
- `refines` ← [[clauses/WSP-CL-HEADER-VALUE-LENGTH-PREFIX|WSP-CL-HEADER-VALUE-LENGTH-PREFIX]]
- `refines` ← [[clauses/WSP-CL-INTEGER-NETWORK-ORDER|WSP-CL-INTEGER-NETWORK-ORDER]]
- `refines` ← [[clauses/WSP-CL-POST-CONTENT-TYPE|WSP-CL-POST-CONTENT-TYPE]]
- `refines` ← [[clauses/WSP-CL-REPLY-CONTENT-TYPE|WSP-CL-REPLY-CONTENT-TYPE]]
- `refines` ← [[clauses/WSP-CL-UNSUPPORTED-ENCODING-RETRY|WSP-CL-UNSUPPORTED-ENCODING-RETRY]]

## Data

```json
{
  "family": "wsp",
  "referencedSection": "8.4",
  "sourceAnchor": {
    "documentId": "WAP-203_003-WSP",
    "staticConformanceSection": "Appendix D"
  },
  "implementationStatus": "implemented",
  "ownerLayers": [
    "transport-rust"
  ],
  "workItems": [
    "WSP-802",
    "T0-20"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
