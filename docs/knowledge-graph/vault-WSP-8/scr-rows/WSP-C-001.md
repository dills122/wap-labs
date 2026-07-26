---
id: "scr-row:WSP-C-001"
key: "WSP-C-001"
type: "scr-row"
generated: true
slice: "WSP-8"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# Device Mode

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wsp|wsp]]
- `planned-by` → [[work-items/WSP-801|WSP-801]]
- `refines` ← [[clauses/WSP-CL-CONNECTIONLESS-NONCONFIRMED|WSP-CL-CONNECTIONLESS-NONCONFIRMED]]
- `refines` ← [[clauses/WSP-CL-DEVICE-CONNECTIONLESS-MODE|WSP-CL-DEVICE-CONNECTIONLESS-MODE]]
- `refines` ← [[clauses/WSP-CL-UNITDATA-DIRECT-MAPPING|WSP-CL-UNITDATA-DIRECT-MAPPING]]

## Data

```json
{
  "family": "wsp",
  "referencedSection": "Section 6,7&8",
  "sourceAnchor": {
    "documentId": "WAP-203_003-WSP",
    "staticConformanceSection": "Appendix D"
  },
  "implementationStatus": "implemented",
  "ownerLayers": [
    "transport-rust"
  ],
  "workItems": [
    "WSP-801",
    "T0-09"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
