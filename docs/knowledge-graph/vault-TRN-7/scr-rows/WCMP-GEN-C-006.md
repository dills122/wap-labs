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
- `refines` ← [[clauses/WCMP-CL-ECHO-CORRELATION-FIELDS|WCMP-CL-ECHO-CORRELATION-FIELDS]]
- `refines` ← [[clauses/WCMP-CL-ECHO-DATA-IDENTITY|WCMP-CL-ECHO-DATA-IDENTITY]]
- `refines` ← [[clauses/WCMP-CL-ECHO-MESSAGE-LAYOUT|WCMP-CL-ECHO-MESSAGE-LAYOUT]]
- `refines` ← [[clauses/WCMP-CL-ECHO-MTU-TRUNCATION|WCMP-CL-ECHO-MTU-TRUNCATION]]
- `refines` ← [[clauses/WCMP-CL-ECHO-REPLY-FUNCTION|WCMP-CL-ECHO-REPLY-FUNCTION]]
- `refines` ← [[clauses/WCMP-CL-ECHO-REPLY-RATE-LIMIT|WCMP-CL-ECHO-REPLY-RATE-LIMIT]]
- `refines` ← [[clauses/WCMP-CL-ECHO-REPLY-TYPE|WCMP-CL-ECHO-REPLY-TYPE]]
- `refines` ← [[clauses/WCMP-CL-GENERAL-TYPE-DISPATCH|WCMP-CL-GENERAL-TYPE-DISPATCH]]
- `refines` ← [[clauses/WCMP-CL-SELECTED-TYPE-CODE-VALUES|WCMP-CL-SELECTED-TYPE-CODE-VALUES]]

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
