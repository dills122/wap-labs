---
id: "scr-row:WDP-NA-C-003"
key: "WDP-NA-C-003"
type: "scr-row"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# Ipv4 addresses support

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wdp|wdp]]
- `planned-by` → [[work-items/TRN-701|TRN-701]]
- `refines` ← [[clauses/WDP-CL-CDPD-UDP-IP-PROFILE|WDP-CL-CDPD-UDP-IP-PROFILE]]
- `refines` ← [[clauses/WDP-CL-DESTINATION-ADDRESS-SEMANTICS|WDP-CL-DESTINATION-ADDRESS-SEMANTICS]]
- `refines` ← [[clauses/WDP-CL-IP-BEARER-REQUIRES-UDP|WDP-CL-IP-BEARER-REQUIRES-UDP]]
- `refines` ← [[clauses/WDP-CL-IP-MAPPING-FRAGMENTATION|WDP-CL-IP-MAPPING-FRAGMENTATION]]
- `refines` ← [[clauses/WDP-CL-IP-MAPPING-IS-UDP|WDP-CL-IP-MAPPING-IS-UDP]]
- `refines` ← [[clauses/WDP-CL-IPV4-BASELINE-RECEIVE-SIZE|WDP-CL-IPV4-BASELINE-RECEIVE-SIZE]]
- `refines` ← [[clauses/WDP-CL-IPV4-DONT-FRAGMENT|WDP-CL-IPV4-DONT-FRAGMENT]]
- `refines` ← [[clauses/WDP-CL-IPV4-FIXED-ADDRESS-SIZE|WDP-CL-IPV4-FIXED-ADDRESS-SIZE]]
- `refines` ← [[clauses/WDP-CL-IPV4-FRAGMENT-REASSEMBLY-KEY|WDP-CL-IPV4-FRAGMENT-REASSEMBLY-KEY]]
- `refines` ← [[clauses/WDP-CL-IPV4-FRAGMENTATION-LOCATION|WDP-CL-IPV4-FRAGMENTATION-LOCATION]]
- `refines` ← [[clauses/WDP-CL-IPV4-HEADER-CHECKSUM|WDP-CL-IPV4-HEADER-CHECKSUM]]
- `refines` ← [[clauses/WDP-CL-IPV4-HEADER-LAYOUT|WDP-CL-IPV4-HEADER-LAYOUT]]
- `refines` ← [[clauses/WDP-CL-IPV4-INDEPENDENT-DATAGRAMS|WDP-CL-IPV4-INDEPENDENT-DATAGRAMS]]
- `refines` ← [[clauses/WDP-CL-IPV4-LARGE-SEND-GUARD|WDP-CL-IPV4-LARGE-SEND-GUARD]]
- `refines` ← [[clauses/WDP-CL-IPV4-ROBUST-INTEROPERATION|WDP-CL-IPV4-ROBUST-INTEROPERATION]]
- `refines` ← [[clauses/WDP-CL-IPV4-SOURCE-DESTINATION-FIELDS|WDP-CL-IPV4-SOURCE-DESTINATION-FIELDS]]
- `refines` ← [[clauses/WDP-CL-IPV4-TOTAL-LENGTH|WDP-CL-IPV4-TOTAL-LENGTH]]
- `refines` ← [[clauses/WDP-CL-IPV4-TTL-ZERO|WDP-CL-IPV4-TTL-ZERO]]
- `refines` ← [[clauses/WDP-CL-IPV4-VERSION-AND-IHL|WDP-CL-IPV4-VERSION-AND-IHL]]
- `refines` ← [[clauses/WDP-CL-SELECTED-BEARER-ASSIGNMENT|WDP-CL-SELECTED-BEARER-ASSIGNMENT]]
- `refines` ← [[clauses/WDP-CL-SOURCE-ADDRESS-SEMANTICS|WDP-CL-SOURCE-ADDRESS-SEMANTICS]]
- `refines` ← [[clauses/WDP-CL-UDP-CHECKSUM-COVERAGE|WDP-CL-UDP-CHECKSUM-COVERAGE]]
- `refines` ← [[clauses/WDP-CL-UDP-DESTINATION-PORT-CONTEXT|WDP-CL-UDP-DESTINATION-PORT-CONTEXT]]
- `refines` ← [[clauses/WDP-CL-UDP-IP-INTERFACE-METADATA|WDP-CL-UDP-IP-INTERFACE-METADATA]]
- `refines` ← [[clauses/WDP-CL-UDP-IP-PROTOCOL-NUMBER|WDP-CL-UDP-IP-PROTOCOL-NUMBER]]
- `refines` ← [[clauses/WDP-CL-UDP-RECEIVE-INTERFACE|WDP-CL-UDP-RECEIVE-INTERFACE]]
- `refines` ← [[clauses/WDP-CL-UDP-SEND-INTERFACE|WDP-CL-UDP-SEND-INTERFACE]]
- `refines` ← [[clauses/WDP-CL-UNITDATA-INDICATION-PARAMETERS|WDP-CL-UNITDATA-INDICATION-PARAMETERS]]
- `refines` ← [[clauses/WDP-CL-UNITDATA-REQUEST-PARAMETERS|WDP-CL-UNITDATA-REQUEST-PARAMETERS]]

## Data

```json
{
  "family": "wdp",
  "referencedSection": "[RFC 791]",
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
