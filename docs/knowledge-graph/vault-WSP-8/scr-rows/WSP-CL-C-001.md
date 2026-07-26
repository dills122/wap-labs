---
id: "scr-row:WSP-CL-C-001"
key: "WSP-CL-C-001"
type: "scr-row"
generated: true
slice: "WSP-8"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# Connectionless

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wsp|wsp]]
- `planned-by` → [[work-items/WSP-801|WSP-801]]
- `refines` ← [[clauses/WSP-CL-COMMUNICATION-FAILURE-LOCAL|WSP-CL-COMMUNICATION-FAILURE-LOCAL]]
- `refines` ← [[clauses/WSP-CL-CONNECTIONLESS-METHOD-FACILITY|WSP-CL-CONNECTIONLESS-METHOD-FACILITY]]
- `refines` ← [[clauses/WSP-CL-CONNECTIONLESS-NONCONFIRMED|WSP-CL-CONNECTIONLESS-NONCONFIRMED]]
- `refines` ← [[clauses/WSP-CL-DEVICE-CONNECTIONLESS-MODE|WSP-CL-DEVICE-CONNECTIONLESS-MODE]]
- `refines` ← [[clauses/WSP-CL-INTEGER-NETWORK-ORDER|WSP-CL-INTEGER-NETWORK-ORDER]]
- `refines` ← [[clauses/WSP-CL-OUT-OF-BAND-PARAMETERS|WSP-CL-OUT-OF-BAND-PARAMETERS]]
- `refines` ← [[clauses/WSP-CL-PEER-INDICATION-DELIVERY|WSP-CL-PEER-INDICATION-DELIVERY]]
- `refines` ← [[clauses/WSP-CL-PRIMITIVE-ROLE-RESTRICTIONS|WSP-CL-PRIMITIVE-ROLE-RESTRICTIONS]]
- `refines` ← [[clauses/WSP-CL-TRANSPORT-ERROR-IGNORED|WSP-CL-TRANSPORT-ERROR-IGNORED]]
- `refines` ← [[clauses/WSP-CL-UNITDATA-DIRECT-MAPPING|WSP-CL-UNITDATA-DIRECT-MAPPING]]
- `refines` ← [[clauses/WSP-CL-UNITDATA-RECEIVE-DISPATCH|WSP-CL-UNITDATA-RECEIVE-DISPATCH]]
- `refines` ← [[clauses/WSP-CL-UNITDATA-SECURITY-EQUIVALENCE|WSP-CL-UNITDATA-SECURITY-EQUIVALENCE]]

## Data

```json
{
  "family": "wsp",
  "referencedSection": "Section 6,7&8",
  "sourceAnchor": {
    "documentId": "WAP-203_003-WSP",
    "staticConformanceSection": "Appendix D"
  },
  "implementationStatus": "implemented",
  "ownerLayers": [
    "transport-rust"
  ],
  "workItems": [
    "WSP-801",
    "T0-09"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
