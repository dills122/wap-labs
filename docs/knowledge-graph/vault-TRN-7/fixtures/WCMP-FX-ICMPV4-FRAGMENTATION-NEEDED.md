---
id: "fixture:WCMP-FX-ICMPV4-FRAGMENTATION-NEEDED"
key: "WCMP-FX-ICMPV4-FRAGMENTATION-NEEDED"
type: "fixture"
generated: true
slice: "TRN-7"
status: "implemented"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/fixture"
---

# Interpret ICMPv4 Destination Unreachable type 3 code 4 as fragmentation needed while the original IPv4 datagram had the DF flag set, preserving the RFC 1191 Next-Hop MTU when present.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `verified-by` ← [[clauses/WCMP-CL-ICMPV4-FRAGMENTATION-NEEDED|WCMP-CL-ICMPV4-FRAGMENTATION-NEEDED]]

## Data

```json
{
  "kind": "error-policy",
  "status": "implemented",
  "assertion": "Interpret ICMPv4 Destination Unreachable type 3 code 4 as fragmentation needed while the original IPv4 datagram had the DF flag set, preserving the RFC 1191 Next-Hop MTU when present.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
