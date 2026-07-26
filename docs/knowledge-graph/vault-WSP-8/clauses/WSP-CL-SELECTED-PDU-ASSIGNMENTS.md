---
id: "clause:WSP-CL-SELECTED-PDU-ASSIGNMENTS"
key: "WSP-CL-SELECTED-PDU-ASSIGNMENTS"
type: "clause"
generated: true
slice: "WSP-8"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Use assigned PDU type 0x40 for GET, 0x60 for POST, and 0x04 for Reply.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-012|RQ-TRN-012]]
- `planned-by` → [[work-items/WSP-801|WSP-801]]
- `planned-by` → [[work-items/WSP-804|WSP-804]]
- `planned-by` → [[work-items/WSP-805|WSP-805]]
- `refines` → [[scr-rows/WSP-CL-C-004|WSP-CL-C-004]]
- `refines` → [[scr-rows/WSP-CL-C-005|WSP-CL-C-005]]
- `refines` → [[scr-rows/WSP-CL-C-006|WSP-CL-C-006]]
- `refines` → [[scr-rows/WSP-CL-C-007|WSP-CL-C-007]]
- `sourced-from` → [[source-documents/WAP-203-WSP|WAP-203-WSP]]
- `verified-by` → [[fixtures/WSP-FX-SELECTED-PDU-ASSIGNMENTS|WSP-FX-SELECTED-PDU-ASSIGNMENTS]]

## Data

```json
{
  "family": "wsp",
  "parentRows": [
    "WSP-CL-C-004",
    "WSP-CL-C-005",
    "WSP-CL-C-006",
    "WSP-CL-C-007"
  ],
  "sourceAnchor": {
    "documentId": "WAP-203-WSP",
    "section": "appendix-a",
    "heading": "Appendix A Assigned Numbers",
    "normalizedTextSha256": "bdc0ba6d57364f866601489bb42892c1f37500e03a27c9e92844f9495bbf9ee9"
  },
  "normativeForce": "table",
  "obligationLevel": "required",
  "obligationSynopsis": "Use assigned PDU type 0x40 for GET, 0x60 for POST, and 0x04 for Reply.",
  "workItems": [
    "T0-27",
    "T0-30",
    "WSP-801",
    "WSP-804",
    "WSP-805"
  ],
  "ownerLayers": [
    "transport-rust"
  ],
  "requirementIds": [
    "RQ-TRN-012"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
