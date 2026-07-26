---
id: "scr-row:WCMP-GEN-C-003"
key: "WCMP-GEN-C-003"
type: "scr-row"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# message type Message Too Big

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wcmp|wcmp]]
- `planned-by` → [[work-items/TRN-703|TRN-703]]
- `refines` ← [[clauses/WCMP-CL-GENERAL-MESSAGE-TOO-BIG-BUFFER-SIGNAL|WCMP-CL-GENERAL-MESSAGE-TOO-BIG-BUFFER-SIGNAL]]
- `refines` ← [[clauses/WCMP-CL-GENERAL-MESSAGE-TOO-BIG-DESTINATION-ADDRESS|WCMP-CL-GENERAL-MESSAGE-TOO-BIG-DESTINATION-ADDRESS]]
- `refines` ← [[clauses/WCMP-CL-GENERAL-MESSAGE-TOO-BIG-STRUCTURE|WCMP-CL-GENERAL-MESSAGE-TOO-BIG-STRUCTURE]]
- `refines` ← [[clauses/WCMP-CL-GENERAL-MESSAGE-TOO-BIG-TYPE-CODE|WCMP-CL-GENERAL-MESSAGE-TOO-BIG-TYPE-CODE]]
- `refines` ← [[clauses/WCMP-CL-GENERAL-MINIMUM-CLIENT-MESSAGE-SET|WCMP-CL-GENERAL-MINIMUM-CLIENT-MESSAGE-SET]]
- `refines` ← [[clauses/WCMP-CL-GENERAL-SELECTED-TYPE-CODE-VALUES|WCMP-CL-GENERAL-SELECTED-TYPE-CODE-VALUES]]

## Data

```json
{
  "family": "wcmp",
  "referencedSection": "5.5.3.3",
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
