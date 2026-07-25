---
id: "scr-row:WCMP-SP-C-001"
key: "WCMP-SP-C-001"
type: "scr-row"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# Does the implementation conform to

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wcmp|wcmp]]
- `planned-by` → [[work-items/TRN-708|TRN-708]]
- `refines` ← [[clauses/WCMP-CL-CDPD-USES-ICMP|WCMP-CL-CDPD-USES-ICMP]]
- `refines` ← [[clauses/WCMP-CL-ICMPV4-CHECKSUM|WCMP-CL-ICMPV4-CHECKSUM]]
- `refines` ← [[clauses/WCMP-CL-ICMPV4-DESTINATION-UNREACHABLE-LAYOUT|WCMP-CL-ICMPV4-DESTINATION-UNREACHABLE-LAYOUT]]
- `refines` ← [[clauses/WCMP-CL-ICMPV4-ECHO-ROUNDTRIP|WCMP-CL-ICMPV4-ECHO-ROUNDTRIP]]
- `refines` ← [[clauses/WCMP-CL-ICMPV4-ERROR-QUOTE|WCMP-CL-ICMPV4-ERROR-QUOTE]]
- `refines` ← [[clauses/WCMP-CL-ICMPV4-FRAGMENTATION-NEEDED|WCMP-CL-ICMPV4-FRAGMENTATION-NEEDED]]
- `refines` ← [[clauses/WCMP-CL-ICMPV4-PORT-UNREACHABLE|WCMP-CL-ICMPV4-PORT-UNREACHABLE]]
- `refines` ← [[clauses/WCMP-CL-ICMPV4-PROTOCOL|WCMP-CL-ICMPV4-PROTOCOL]]
- `refines` ← [[clauses/WCMP-CL-IP-NETWORKS-USE-ICMP|WCMP-CL-IP-NETWORKS-USE-ICMP]]

## Data

```json
{
  "family": "wcmp",
  "referencedSection": "[RFC792],",
  "sourceAnchor": {
    "documentId": "WAP-202-WCMP",
    "staticConformanceSection": "Appendix A"
  },
  "implementationStatus": "implemented",
  "ownerLayers": [
    "transport-rust"
  ],
  "workItems": [
    "TRN-708"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
