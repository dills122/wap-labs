---
id: "scr-row:WCMP-SP-C-002"
key: "WCMP-SP-C-002"
type: "scr-row"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# Does the implementation conform to the

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wcmp|wcmp]]
- `planned-by` → [[work-items/TRN-703|TRN-703]]
- `refines` ← [[clauses/WCMP-CL-GENERAL-ADDRESS-INFORMATION-STRUCTURE|WCMP-CL-GENERAL-ADDRESS-INFORMATION-STRUCTURE]]
- `refines` ← [[clauses/WCMP-CL-GENERAL-ERROR-RESPONSE-SUPPRESSION|WCMP-CL-GENERAL-ERROR-RESPONSE-SUPPRESSION]]
- `refines` ← [[clauses/WCMP-CL-GENERAL-FRAGMENT-ERROR-SINGLE-RESPONSE|WCMP-CL-GENERAL-FRAGMENT-ERROR-SINGLE-RESPONSE]]
- `refines` ← [[clauses/WCMP-CL-GENERAL-IP-ADDRESS-BIT-ORDER|WCMP-CL-GENERAL-IP-ADDRESS-BIT-ORDER]]
- `refines` ← [[clauses/WCMP-CL-GENERAL-MINIMUM-CLIENT-MESSAGE-SET|WCMP-CL-GENERAL-MINIMUM-CLIENT-MESSAGE-SET]]
- `refines` ← [[clauses/WCMP-CL-GENERAL-NETWORK-BYTE-ORDER|WCMP-CL-GENERAL-NETWORK-BYTE-ORDER]]
- `refines` ← [[clauses/WCMP-CL-GENERAL-NON-IP-SCOPE|WCMP-CL-GENERAL-NON-IP-SCOPE]]
- `refines` ← [[clauses/WCMP-CL-GENERAL-SELECTED-TYPE-CODE-VALUES|WCMP-CL-GENERAL-SELECTED-TYPE-CODE-VALUES]]
- `refines` ← [[clauses/WCMP-CL-GENERAL-SINGLE-BEARER-FRAGMENT|WCMP-CL-GENERAL-SINGLE-BEARER-FRAGMENT]]
- `refines` ← [[clauses/WCMP-CL-GENERAL-TYPE-CLASS-RANGES|WCMP-CL-GENERAL-TYPE-CLASS-RANGES]]
- `refines` ← [[clauses/WCMP-CL-GENERAL-TYPE-CODE-DATA-STRUCTURE|WCMP-CL-GENERAL-TYPE-CODE-DATA-STRUCTURE]]

## Data

```json
{
  "family": "wcmp",
  "referencedSection": "5.4, 5.5.1",
  "sourceAnchor": {
    "documentId": "WAP-202-WCMP",
    "staticConformanceSection": "Appendix A"
  },
  "implementationStatus": "implemented",
  "ownerLayers": [
    "transport-rust"
  ],
  "workItems": [
    "TRN-703",
    "T0-17"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
