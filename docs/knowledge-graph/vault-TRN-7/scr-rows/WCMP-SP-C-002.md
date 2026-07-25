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
- `refines` ← [[clauses/WCMP-CL-CLIENT-GENERAL-PROFILE|WCMP-CL-CLIENT-GENERAL-PROFILE]]
- `refines` ← [[clauses/WCMP-CL-ERROR-AND-DIAGNOSTIC-ROLES|WCMP-CL-ERROR-AND-DIAGNOSTIC-ROLES]]
- `refines` ← [[clauses/WCMP-CL-FORGED-MESSAGE-CAUTION|WCMP-CL-FORGED-MESSAGE-CAUTION]]
- `refines` ← [[clauses/WCMP-CL-GENERAL-HEADER-ORDER|WCMP-CL-GENERAL-HEADER-ORDER]]
- `refines` ← [[clauses/WCMP-CL-GENERAL-NETWORK-ORDER|WCMP-CL-GENERAL-NETWORK-ORDER]]
- `refines` ← [[clauses/WCMP-CL-GENERAL-TYPE-CLASSES|WCMP-CL-GENERAL-TYPE-CLASSES]]
- `refines` ← [[clauses/WCMP-CL-GENERAL-TYPE-DISPATCH|WCMP-CL-GENERAL-TYPE-DISPATCH]]
- `refines` ← [[clauses/WCMP-CL-NO-ERROR-TO-ERROR|WCMP-CL-NO-ERROR-TO-ERROR]]
- `refines` ← [[clauses/WCMP-CL-ONE-FRAGMENT-ERROR|WCMP-CL-ONE-FRAGMENT-ERROR]]
- `refines` ← [[clauses/WCMP-CL-SINGLE-BEARER-FRAGMENT|WCMP-CL-SINGLE-BEARER-FRAGMENT]]

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
