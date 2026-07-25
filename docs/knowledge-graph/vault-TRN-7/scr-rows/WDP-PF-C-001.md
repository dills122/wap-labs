---
id: "scr-row:WDP-PF-C-001"
key: "WDP-PF-C-001"
type: "scr-row"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# Abstract service primitive functions for

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wdp|wdp]]
- `planned-by` → [[work-items/TRN-701|TRN-701]]
- `refines` ← [[clauses/WDP-CL-DESTINATION-ADDRESS-SEMANTICS|WDP-CL-DESTINATION-ADDRESS-SEMANTICS]]
- `refines` ← [[clauses/WDP-CL-DESTINATION-PORT-SEMANTICS|WDP-CL-DESTINATION-PORT-SEMANTICS]]
- `refines` ← [[clauses/WDP-CL-IPV4-SOURCE-DESTINATION-FIELDS|WDP-CL-IPV4-SOURCE-DESTINATION-FIELDS]]
- `refines` ← [[clauses/WDP-CL-SOURCE-ADDRESS-SEMANTICS|WDP-CL-SOURCE-ADDRESS-SEMANTICS]]
- `refines` ← [[clauses/WDP-CL-SOURCE-PORT-SEMANTICS|WDP-CL-SOURCE-PORT-SEMANTICS]]
- `refines` ← [[clauses/WDP-CL-UDP-SEND-INTERFACE|WDP-CL-UDP-SEND-INTERFACE]]
- `refines` ← [[clauses/WDP-CL-UNITDATA-CONTENT-TRANSPARENCY|WDP-CL-UNITDATA-CONTENT-TRANSPARENCY]]
- `refines` ← [[clauses/WDP-CL-UNITDATA-REQUEST-ANYTIME|WDP-CL-UNITDATA-REQUEST-ANYTIME]]
- `refines` ← [[clauses/WDP-CL-UNITDATA-REQUEST-PARAMETERS|WDP-CL-UNITDATA-REQUEST-PARAMETERS]]

## Data

```json
{
  "family": "wdp",
  "referencedSection": "6.3.1.1",
  "sourceAnchor": {
    "documentId": "WAP-200_005-WDP",
    "staticConformanceSection": "Appendix E"
  },
  "implementationStatus": "partial",
  "ownerLayers": [
    "transport-rust"
  ],
  "workItems": [
    "TRN-701",
    "T0-19"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
