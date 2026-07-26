---
id: "clause:WSP-CL-PDU-TYPE-DISPATCH"
key: "WSP-CL-PDU-TYPE-DISPATCH"
type: "clause"
generated: true
slice: "WSP-8"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Use the PDU type octet to select the function and type-specific remainder of the WSP PDU.

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
- `verified-by` → [[fixtures/WSP-FX-PDU-TYPE-DISPATCH|WSP-FX-PDU-TYPE-DISPATCH]]

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
    "section": "8.2.1",
    "heading": "8.2.1 PDU Common Fields",
    "normalizedTextSha256": "07343a3823b7a50c43c28e8b19725897a672709e2c72a85d36c0ef0ee1a69f81"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Use the PDU type octet to select the function and type-specific remainder of the WSP PDU.",
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
