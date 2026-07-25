---
id: "scr-row:WDP-CT-C-002"
key: "WDP-CT-C-002"
type: "scr-row"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# CDPD technology

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wdp|wdp]]
- `planned-by` → [[work-items/TRN-701|TRN-701]]
- `refines` ← [[clauses/WDP-CL-ADAPTATION-LAYER-BOUNDARY|WDP-CL-ADAPTATION-LAYER-BOUNDARY]]
- `refines` ← [[clauses/WDP-CL-CDPD-UDP-IP-PROFILE|WDP-CL-CDPD-UDP-IP-PROFILE]]
- `refines` ← [[clauses/WDP-CL-IP-BEARER-REQUIRES-UDP|WDP-CL-IP-BEARER-REQUIRES-UDP]]
- `refines` ← [[clauses/WDP-CL-IP-MAPPING-FRAGMENTATION|WDP-CL-IP-MAPPING-FRAGMENTATION]]
- `refines` ← [[clauses/WDP-CL-IP-MAPPING-IS-UDP|WDP-CL-IP-MAPPING-IS-UDP]]
- `refines` ← [[clauses/WDP-CL-SELECTED-BEARER-ASSIGNMENT|WDP-CL-SELECTED-BEARER-ASSIGNMENT]]
- `refines` ← [[clauses/WDP-CL-UDP-IP-PROTOCOL-NUMBER|WDP-CL-UDP-IP-PROTOCOL-NUMBER]]

## Data

```json
{
  "family": "wdp",
  "referencedSection": "[TIA/EIA/IS-732]",
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
