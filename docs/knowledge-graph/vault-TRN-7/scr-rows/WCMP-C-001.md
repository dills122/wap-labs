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
- `planned-by` → [[work-items/TRN-703|TRN-703]]
- `refines` ← [[clauses/WCMP-CL-CLIENT-GENERAL-PROFILE|WCMP-CL-CLIENT-GENERAL-PROFILE]]
- `refines` ← [[clauses/WCMP-CL-ERROR-AND-DIAGNOSTIC-ROLES|WCMP-CL-ERROR-AND-DIAGNOSTIC-ROLES]]
- `refines` ← [[clauses/WCMP-CL-FORGED-MESSAGE-CAUTION|WCMP-CL-FORGED-MESSAGE-CAUTION]]
- `refines` ← [[clauses/WCMP-CL-NO-ERROR-TO-ERROR|WCMP-CL-NO-ERROR-TO-ERROR]]
- `refines` ← [[clauses/WCMP-CL-ONE-FRAGMENT-ERROR|WCMP-CL-ONE-FRAGMENT-ERROR]]
- `refines` ← [[clauses/WCMP-CL-SINGLE-BEARER-FRAGMENT|WCMP-CL-SINGLE-BEARER-FRAGMENT]]

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
    "TRN-703",
    "T0-17"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
