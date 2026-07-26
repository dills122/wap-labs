---
id: "clause:WSP-CL-REPLY-STATUS-ASSIGNMENT"
key: "WSP-CL-REPLY-STATUS-ASSIGNMENT"
type: "clause"
generated: true
slice: "WSP-8"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Map HTTP/1.1 response statuses to and from every assigned single-octet WSP status in Table 36.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-012|RQ-TRN-012]]
- `planned-by` → [[work-items/WSP-801|WSP-801]]
- `planned-by` → [[work-items/WSP-804|WSP-804]]
- `planned-by` → [[work-items/WSP-805|WSP-805]]
- `refines` → [[scr-rows/WSP-CL-C-005|WSP-CL-C-005]]
- `refines` → [[scr-rows/WSP-CL-C-007|WSP-CL-C-007]]
- `sourced-from` → [[source-documents/WAP-203-WSP|WAP-203-WSP]]
- `verified-by` → [[fixtures/WSP-FX-REPLY-STATUS-ASSIGNMENT|WSP-FX-REPLY-STATUS-ASSIGNMENT]]

## Data

```json
{
  "family": "wsp",
  "parentRows": [
    "WSP-CL-C-005",
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
  "obligationSynopsis": "Map HTTP/1.1 response statuses to and from every assigned single-octet WSP status in Table 36.",
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
