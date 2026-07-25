---
id: "scr-row:WDP-NA-C-000"
key: "WDP-NA-C-000"
type: "scr-row"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# At least one network addressing

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wdp|wdp]]
- `planned-by` → [[work-items/TRN-701|TRN-701]]
- `refines` ← [[clauses/WDP-CL-DESTINATION-ADDRESS-SEMANTICS|WDP-CL-DESTINATION-ADDRESS-SEMANTICS]]
- `refines` ← [[clauses/WDP-CL-IPV4-FIXED-ADDRESS-SIZE|WDP-CL-IPV4-FIXED-ADDRESS-SIZE]]
- `refines` ← [[clauses/WDP-CL-SOURCE-ADDRESS-SEMANTICS|WDP-CL-SOURCE-ADDRESS-SEMANTICS]]
- `refines` ← [[clauses/WDP-CL-UNITDATA-INDICATION-PARAMETERS|WDP-CL-UNITDATA-INDICATION-PARAMETERS]]
- `refines` ← [[clauses/WDP-CL-UNITDATA-REQUEST-PARAMETERS|WDP-CL-UNITDATA-REQUEST-PARAMETERS]]

## Data

```json
{
  "family": "wdp",
  "referencedSection": null,
  "sourceAnchor": {
    "documentId": "WAP-200_005-WDP",
    "staticConformanceSection": "Appendix E"
  },
  "implementationStatus": "implemented",
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
