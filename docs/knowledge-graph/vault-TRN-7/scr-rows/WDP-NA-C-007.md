---
id: "scr-row:WDP-NA-C-007"
key: "WDP-NA-C-007"
type: "scr-row"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# Source Port application

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wdp|wdp]]
- `planned-by` → [[work-items/TRN-701|TRN-701]]
- `refines` ← [[clauses/WDP-CL-APPLICATION-PORT-ADDRESSING|WDP-CL-APPLICATION-PORT-ADDRESSING]]
- `refines` ← [[clauses/WDP-CL-PROTOCOL-REQUIRED-PORT-FIELDS|WDP-CL-PROTOCOL-REQUIRED-PORT-FIELDS]]
- `refines` ← [[clauses/WDP-CL-SIMULTANEOUS-INSTANCES|WDP-CL-SIMULTANEOUS-INSTANCES]]
- `refines` ← [[clauses/WDP-CL-SOURCE-PORT-SEMANTICS|WDP-CL-SOURCE-PORT-SEMANTICS]]
- `refines` ← [[clauses/WDP-CL-UDP-HEADER-LAYOUT|WDP-CL-UDP-HEADER-LAYOUT]]
- `refines` ← [[clauses/WDP-CL-UDP-RECEIVE-INTERFACE|WDP-CL-UDP-RECEIVE-INTERFACE]]
- `refines` ← [[clauses/WDP-CL-UDP-SEND-INTERFACE|WDP-CL-UDP-SEND-INTERFACE]]
- `refines` ← [[clauses/WDP-CL-UDP-SOURCE-PORT-ZERO|WDP-CL-UDP-SOURCE-PORT-ZERO]]
- `refines` ← [[clauses/WDP-CL-UNITDATA-INDICATION-PARAMETERS|WDP-CL-UNITDATA-INDICATION-PARAMETERS]]
- `refines` ← [[clauses/WDP-CL-UNITDATA-REQUEST-PARAMETERS|WDP-CL-UNITDATA-REQUEST-PARAMETERS]]
- `refines` ← [[clauses/WDP-CL-WAP-PORT-REGISTRY|WDP-CL-WAP-PORT-REGISTRY]]

## Data

```json
{
  "family": "wdp",
  "referencedSection": "3.1, 6.1",
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
