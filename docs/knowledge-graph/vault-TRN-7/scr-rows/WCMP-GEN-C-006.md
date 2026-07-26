---
id: "scr-row:WCMP-GEN-C-006"
key: "WCMP-GEN-C-006"
type: "scr-row"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# message type Echo Reply

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wcmp|wcmp]]
- `planned-by` → [[work-items/TRN-703|TRN-703]]
- `refines` ← [[clauses/WCMP-CL-GENERAL-ECHO-CORRELATION-FIELDS|WCMP-CL-GENERAL-ECHO-CORRELATION-FIELDS]]
- `refines` ← [[clauses/WCMP-CL-GENERAL-ECHO-DATA-ROUNDTRIP|WCMP-CL-GENERAL-ECHO-DATA-ROUNDTRIP]]
- `refines` ← [[clauses/WCMP-CL-GENERAL-ECHO-PATH-MTU-TRUNCATION|WCMP-CL-GENERAL-ECHO-PATH-MTU-TRUNCATION]]
- `refines` ← [[clauses/WCMP-CL-GENERAL-ECHO-REPLY-REQUIRED|WCMP-CL-GENERAL-ECHO-REPLY-REQUIRED]]
- `refines` ← [[clauses/WCMP-CL-GENERAL-ECHO-STRUCTURE|WCMP-CL-GENERAL-ECHO-STRUCTURE]]
- `refines` ← [[clauses/WCMP-CL-GENERAL-ECHO-TYPE-CODE|WCMP-CL-GENERAL-ECHO-TYPE-CODE]]
- `refines` ← [[clauses/WCMP-CL-GENERAL-MINIMUM-CLIENT-MESSAGE-SET|WCMP-CL-GENERAL-MINIMUM-CLIENT-MESSAGE-SET]]
- `refines` ← [[clauses/WCMP-CL-GENERAL-SELECTED-TYPE-CODE-VALUES|WCMP-CL-GENERAL-SELECTED-TYPE-CODE-VALUES]]

## Data

```json
{
  "family": "wcmp",
  "referencedSection": "5.5.3.5",
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
