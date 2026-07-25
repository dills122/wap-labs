---
id: "fixture:WCMP-FX-ICMPV4-ERROR-QUOTE"
key: "WCMP-FX-ICMPV4-ERROR-QUOTE"
type: "fixture"
generated: true
slice: "TRN-7"
status: "implemented"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/fixture"
---

# Preserve the quoted original IPv4 header and first 64 data bits so the ICMPv4 error can be correlated with the affected WDP UDP datagram.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `verified-by` ← [[clauses/WCMP-CL-ICMPV4-ERROR-QUOTE|WCMP-CL-ICMPV4-ERROR-QUOTE]]

## Data

```json
{
  "kind": "binary-decoder",
  "status": "implemented",
  "assertion": "Preserve the quoted original IPv4 header and first 64 data bits so the ICMPv4 error can be correlated with the affected WDP UDP datagram.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
