---
id: "scr-row:WCMP-GEN-C-001"
key: "WCMP-GEN-C-001"
type: "scr-row"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# WCMP message type Destination

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wcmp|wcmp]]
- `planned-by` → [[work-items/TRN-703|TRN-703]]
- `refines` ← [[clauses/WCMP-CL-DESTINATION-UNREACHABLE-ADDRESS|WCMP-CL-DESTINATION-UNREACHABLE-ADDRESS]]
- `refines` ← [[clauses/WCMP-CL-DESTINATION-UNREACHABLE-CODES|WCMP-CL-DESTINATION-UNREACHABLE-CODES]]
- `refines` ← [[clauses/WCMP-CL-DESTINATION-UNREACHABLE-GENERAL-GENERATION|WCMP-CL-DESTINATION-UNREACHABLE-GENERAL-GENERATION]]
- `refines` ← [[clauses/WCMP-CL-DESTINATION-UNREACHABLE-LAYOUT|WCMP-CL-DESTINATION-UNREACHABLE-LAYOUT]]
- `refines` ← [[clauses/WCMP-CL-DESTINATION-UNREACHABLE-NO-CONGESTION|WCMP-CL-DESTINATION-UNREACHABLE-NO-CONGESTION]]
- `refines` ← [[clauses/WCMP-CL-DESTINATION-UNREACHABLE-PORT-REQUIRED|WCMP-CL-DESTINATION-UNREACHABLE-PORT-REQUIRED]]
- `refines` ← [[clauses/WCMP-CL-GENERAL-TYPE-DISPATCH|WCMP-CL-GENERAL-TYPE-DISPATCH]]
- `refines` ← [[clauses/WCMP-CL-SELECTED-TYPE-CODE-VALUES|WCMP-CL-SELECTED-TYPE-CODE-VALUES]]

## Data

```json
{
  "family": "wcmp",
  "referencedSection": "5.5.3.1",
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
