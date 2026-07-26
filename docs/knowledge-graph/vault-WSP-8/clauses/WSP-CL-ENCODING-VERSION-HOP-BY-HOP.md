---
id: "clause:WSP-CL-ENCODING-VERSION-HOP-BY-HOP"
key: "WSP-CL-ENCODING-VERSION-HOP-BY-HOP"
type: "clause"
generated: true
slice: "WSP-8"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Treat Encoding-Version as hop-by-hop rather than forwarding it as an end-to-end application header.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-014|RQ-TRN-014]]
- `planned-by` → [[work-items/WSP-802|WSP-802]]
- `refines` → [[scr-rows/WSP-CL-C-020|WSP-CL-C-020]]
- `sourced-from` → [[source-documents/WAP-203-WSP|WAP-203-WSP]]
- `verified-by` → [[fixtures/WSP-FX-ENCODING-VERSION-HOP-BY-HOP|WSP-FX-ENCODING-VERSION-HOP-BY-HOP]]

## Data

```json
{
  "family": "wsp",
  "parentRows": [
    "WSP-CL-C-020"
  ],
  "sourceAnchor": {
    "documentId": "WAP-203-WSP",
    "section": "8.4.4",
    "heading": "8.4.4 End-to-end and Hop-by-hop Headers",
    "normalizedTextSha256": "0fa887b48d3a3c00b6125c5c2096dfe7fb183421b5d8f623e6e9b83695b63696"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Treat Encoding-Version as hop-by-hop rather than forwarding it as an end-to-end application header.",
  "workItems": [
    "T0-20",
    "WSP-802"
  ],
  "ownerLayers": [
    "transport-rust"
  ],
  "requirementIds": [
    "RQ-TRN-014"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
