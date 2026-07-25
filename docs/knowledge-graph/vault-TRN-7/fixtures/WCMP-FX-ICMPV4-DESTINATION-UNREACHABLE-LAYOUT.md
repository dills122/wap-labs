---
id: "fixture:WCMP-FX-ICMPV4-DESTINATION-UNREACHABLE-LAYOUT"
key: "WCMP-FX-ICMPV4-DESTINATION-UNREACHABLE-LAYOUT"
type: "fixture"
generated: true
slice: "TRN-7"
status: "implemented"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/fixture"
---

# Decode ICMPv4 Destination Unreachable as Type 3, Code, Checksum, four-octet type-specific data, and the quoted original IPv4 header plus data.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `verified-by` ← [[clauses/WCMP-CL-ICMPV4-DESTINATION-UNREACHABLE-LAYOUT|WCMP-CL-ICMPV4-DESTINATION-UNREACHABLE-LAYOUT]]

## Data

```json
{
  "kind": "binary-decoder",
  "status": "implemented",
  "assertion": "Decode ICMPv4 Destination Unreachable as Type 3, Code, Checksum, four-octet type-specific data, and the quoted original IPv4 header plus data.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
