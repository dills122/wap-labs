---
id: "scr-row:WDP-CORE-C-001"
key: "WDP-CORE-C-001"
type: "scr-row"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# Basic WDP functions

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wdp|wdp]]
- `planned-by` → [[work-items/TRN-701|TRN-701]]
- `refines` ← [[clauses/WDP-CL-APPLICATION-PORT-ADDRESSING|WDP-CL-APPLICATION-PORT-ADDRESSING]]
- `refines` ← [[clauses/WDP-CL-BEARER-TRANSPARENCY|WDP-CL-BEARER-TRANSPARENCY]]
- `refines` ← [[clauses/WDP-CL-CONSISTENT-TRANSPORT-SERVICE|WDP-CL-CONSISTENT-TRANSPORT-SERVICE]]
- `refines` ← [[clauses/WDP-CL-IPV4-BASELINE-RECEIVE-SIZE|WDP-CL-IPV4-BASELINE-RECEIVE-SIZE]]
- `refines` ← [[clauses/WDP-CL-IPV4-DONT-FRAGMENT|WDP-CL-IPV4-DONT-FRAGMENT]]
- `refines` ← [[clauses/WDP-CL-IPV4-FRAGMENT-REASSEMBLY-KEY|WDP-CL-IPV4-FRAGMENT-REASSEMBLY-KEY]]
- `refines` ← [[clauses/WDP-CL-IPV4-FRAGMENTATION-LOCATION|WDP-CL-IPV4-FRAGMENTATION-LOCATION]]
- `refines` ← [[clauses/WDP-CL-IPV4-INDEPENDENT-DATAGRAMS|WDP-CL-IPV4-INDEPENDENT-DATAGRAMS]]
- `refines` ← [[clauses/WDP-CL-IPV4-LARGE-SEND-GUARD|WDP-CL-IPV4-LARGE-SEND-GUARD]]
- `refines` ← [[clauses/WDP-CL-IPV4-NO-RELIABILITY|WDP-CL-IPV4-NO-RELIABILITY]]
- `refines` ← [[clauses/WDP-CL-IPV4-TOTAL-LENGTH|WDP-CL-IPV4-TOTAL-LENGTH]]
- `refines` ← [[clauses/WDP-CL-PROTOCOL-REQUIRED-PORT-FIELDS|WDP-CL-PROTOCOL-REQUIRED-PORT-FIELDS]]
- `refines` ← [[clauses/WDP-CL-SIMULTANEOUS-INSTANCES|WDP-CL-SIMULTANEOUS-INSTANCES]]
- `refines` ← [[clauses/WDP-CL-UDP-CHECKSUM-COVERAGE|WDP-CL-UDP-CHECKSUM-COVERAGE]]
- `refines` ← [[clauses/WDP-CL-UDP-CHECKSUM-OMISSION|WDP-CL-UDP-CHECKSUM-OMISSION]]
- `refines` ← [[clauses/WDP-CL-UDP-CHECKSUM-PADDING|WDP-CL-UDP-CHECKSUM-PADDING]]
- `refines` ← [[clauses/WDP-CL-UDP-CHECKSUM-ZERO-ENCODING|WDP-CL-UDP-CHECKSUM-ZERO-ENCODING]]
- `refines` ← [[clauses/WDP-CL-UDP-HEADER-LAYOUT|WDP-CL-UDP-HEADER-LAYOUT]]
- `refines` ← [[clauses/WDP-CL-UDP-IP-INTERFACE-METADATA|WDP-CL-UDP-IP-INTERFACE-METADATA]]
- `refines` ← [[clauses/WDP-CL-UDP-LENGTH-BOUNDS|WDP-CL-UDP-LENGTH-BOUNDS]]
- `refines` ← [[clauses/WDP-CL-UDP-UNRELIABLE-DATAGRAMS|WDP-CL-UDP-UNRELIABLE-DATAGRAMS]]
- `refines` ← [[clauses/WDP-CL-UNITDATA-CONTENT-TRANSPARENCY|WDP-CL-UNITDATA-CONTENT-TRANSPARENCY]]
- `refines` ← [[clauses/WDP-CL-UNITDATA-INDICATION-PARAMETERS|WDP-CL-UNITDATA-INDICATION-PARAMETERS]]
- `refines` ← [[clauses/WDP-CL-UNITDATA-REQUEST-PARAMETERS|WDP-CL-UNITDATA-REQUEST-PARAMETERS]]

## Data

```json
{
  "family": "wdp",
  "referencedSection": "Appendix E",
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
