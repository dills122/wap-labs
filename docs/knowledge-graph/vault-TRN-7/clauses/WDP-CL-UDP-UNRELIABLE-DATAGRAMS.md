---
id: "clause:WDP-CL-UDP-UNRELIABLE-DATAGRAMS"
key: "WDP-CL-UDP-UNRELIABLE-DATAGRAMS"
type: "clause"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Expose UDP as a connectionless datagram service that does not guarantee delivery, ordering, or duplicate suppression.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-001|RQ-TRN-001]]
- `planned-by` → [[work-items/TRN-701|TRN-701]]
- `refines` → [[scr-rows/WDP-C-001|WDP-C-001]]
- `refines` → [[scr-rows/WDP-CORE-C-001|WDP-CORE-C-001]]
- `sourced-from` → [[source-documents/rfc-768|rfc-768]]
- `verified-by` → [[fixtures/WDP-FX-UDP-UNRELIABLE-DATAGRAMS|WDP-FX-UDP-UNRELIABLE-DATAGRAMS]]

## Data

```json
{
  "family": "wdp",
  "parentRows": [
    "WDP-C-001",
    "WDP-CORE-C-001"
  ],
  "sourceAnchor": {
    "documentId": "rfc-768",
    "section": "introduction",
    "heading": "Introduction",
    "normalizedTextSha256": "27059326d59c7337267f8d1749b5aed63e548378bc44c2d26a1e6484372c5849"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Expose UDP as a connectionless datagram service that does not guarantee delivery, ordering, or duplicate suppression.",
  "workItems": [
    "T0-19",
    "TRN-701"
  ],
  "ownerLayers": [
    "transport-rust"
  ],
  "requirementIds": [
    "RQ-TRN-001"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
