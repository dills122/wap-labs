---
id: "clause:WSP-CL-CONNECTIONLESS-NONCONFIRMED"
key: "WSP-CL-CONNECTIONLESS-NONCONFIRMED"
type: "clause"
generated: true
slice: "WSP-8"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Exchange method content through non-confirmed facilities and tolerate unreliable peer communication.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-010|RQ-TRN-010]]
- `planned-by` → [[work-items/WSP-801|WSP-801]]
- `refines` → [[scr-rows/WSP-C-001|WSP-C-001]]
- `refines` → [[scr-rows/WSP-CL-C-001|WSP-CL-C-001]]
- `sourced-from` → [[source-documents/WAP-203-WSP|WAP-203-WSP]]
- `verified-by` → [[fixtures/WSP-FX-CONNECTIONLESS-NONCONFIRMED|WSP-FX-CONNECTIONLESS-NONCONFIRMED]]

## Data

```json
{
  "family": "wsp",
  "parentRows": [
    "WSP-C-001",
    "WSP-CL-C-001"
  ],
  "sourceAnchor": {
    "documentId": "WAP-203-WSP",
    "section": "6.4.1",
    "heading": "6.4.1 Overview",
    "normalizedTextSha256": "8b01900af4fc38e8082b5d48d76ac3e0dfe1ed2c59d7855bc43583959a6f44ea"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Exchange method content through non-confirmed facilities and tolerate unreliable peer communication.",
  "workItems": [
    "T0-09",
    "WSP-801"
  ],
  "ownerLayers": [
    "transport-rust"
  ],
  "requirementIds": [
    "RQ-TRN-010"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
