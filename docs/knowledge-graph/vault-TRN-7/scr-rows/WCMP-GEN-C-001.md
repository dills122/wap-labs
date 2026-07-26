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
- `refines` ← [[clauses/WCMP-CL-GENERAL-CONGESTION-SUPPRESSION|WCMP-CL-GENERAL-CONGESTION-SUPPRESSION]]
- `refines` ← [[clauses/WCMP-CL-GENERAL-DESTINATION-UNREACHABLE-ADDRESS|WCMP-CL-GENERAL-DESTINATION-UNREACHABLE-ADDRESS]]
- `refines` ← [[clauses/WCMP-CL-GENERAL-DESTINATION-UNREACHABLE-CODES|WCMP-CL-GENERAL-DESTINATION-UNREACHABLE-CODES]]
- `refines` ← [[clauses/WCMP-CL-GENERAL-DESTINATION-UNREACHABLE-GENERATION|WCMP-CL-GENERAL-DESTINATION-UNREACHABLE-GENERATION]]
- `refines` ← [[clauses/WCMP-CL-GENERAL-DESTINATION-UNREACHABLE-STRUCTURE|WCMP-CL-GENERAL-DESTINATION-UNREACHABLE-STRUCTURE]]
- `refines` ← [[clauses/WCMP-CL-GENERAL-MINIMUM-CLIENT-MESSAGE-SET|WCMP-CL-GENERAL-MINIMUM-CLIENT-MESSAGE-SET]]
- `refines` ← [[clauses/WCMP-CL-GENERAL-PORT-UNREACHABLE-GENERATION|WCMP-CL-GENERAL-PORT-UNREACHABLE-GENERATION]]
- `refines` ← [[clauses/WCMP-CL-GENERAL-SELECTED-TYPE-CODE-VALUES|WCMP-CL-GENERAL-SELECTED-TYPE-CODE-VALUES]]

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
