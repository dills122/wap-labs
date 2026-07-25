---
id: "scr-row:WDP-C-001"
key: "WDP-C-001"
type: "scr-row"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# WDP client functions

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wdp|wdp]]
- `planned-by` → [[work-items/TRN-701|TRN-701]]
- `refines` ← [[clauses/WDP-CL-ADAPTATION-LAYER-BOUNDARY|WDP-CL-ADAPTATION-LAYER-BOUNDARY]]
- `refines` ← [[clauses/WDP-CL-BEARER-TRANSPARENCY|WDP-CL-BEARER-TRANSPARENCY]]
- `refines` ← [[clauses/WDP-CL-CONSISTENT-TRANSPORT-SERVICE|WDP-CL-CONSISTENT-TRANSPORT-SERVICE]]
- `refines` ← [[clauses/WDP-CL-IP-BEARER-REQUIRES-UDP|WDP-CL-IP-BEARER-REQUIRES-UDP]]
- `refines` ← [[clauses/WDP-CL-IP-MAPPING-FRAGMENTATION|WDP-CL-IP-MAPPING-FRAGMENTATION]]
- `refines` ← [[clauses/WDP-CL-IP-MAPPING-IS-UDP|WDP-CL-IP-MAPPING-IS-UDP]]
- `refines` ← [[clauses/WDP-CL-IPV4-INDEPENDENT-DATAGRAMS|WDP-CL-IPV4-INDEPENDENT-DATAGRAMS]]
- `refines` ← [[clauses/WDP-CL-IPV4-NO-RELIABILITY|WDP-CL-IPV4-NO-RELIABILITY]]
- `refines` ← [[clauses/WDP-CL-SELECTED-WSP-PORT|WDP-CL-SELECTED-WSP-PORT]]
- `refines` ← [[clauses/WDP-CL-SIMULTANEOUS-INSTANCES|WDP-CL-SIMULTANEOUS-INSTANCES]]
- `refines` ← [[clauses/WDP-CL-UDP-UNRELIABLE-DATAGRAMS|WDP-CL-UDP-UNRELIABLE-DATAGRAMS]]

## Data

```json
{
  "family": "wdp",
  "referencedSection": "Appendix E",
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
