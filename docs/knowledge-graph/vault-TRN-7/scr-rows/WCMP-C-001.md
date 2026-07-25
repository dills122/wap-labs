---
id: "scr-row:WCMP-C-001"
key: "WCMP-C-001"
type: "scr-row"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# WCMP in client

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wcmp|wcmp]]
- `planned-by` → [[work-items/TRN-708|TRN-708]]
- `refines` ← [[clauses/WCMP-CL-CDPD-USES-ICMP|WCMP-CL-CDPD-USES-ICMP]]
- `refines` ← [[clauses/WCMP-CL-IP-NETWORKS-USE-ICMP|WCMP-CL-IP-NETWORKS-USE-ICMP]]

## Data

```json
{
  "family": "wcmp",
  "referencedSection": null,
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
