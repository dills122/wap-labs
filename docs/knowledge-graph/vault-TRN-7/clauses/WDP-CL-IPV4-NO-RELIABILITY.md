---
id: "clause:WDP-CL-IPV4-NO-RELIABILITY"
key: "WDP-CL-IPV4-NO-RELIABILITY"
type: "clause"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Do not imply acknowledgments, retransmission, data error control, or flow control at the IPv4 layer.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-001|RQ-TRN-001]]
- `planned-by` → [[work-items/TRN-701|TRN-701]]
- `refines` → [[scr-rows/WDP-C-001|WDP-C-001]]
- `refines` → [[scr-rows/WDP-CORE-C-001|WDP-CORE-C-001]]
- `sourced-from` → [[source-documents/rfc-791|rfc-791]]
- `verified-by` → [[fixtures/WDP-FX-IPV4-NO-RELIABILITY|WDP-FX-IPV4-NO-RELIABILITY]]

## Data

```json
{
  "family": "wdp",
  "parentRows": [
    "WDP-C-001",
    "WDP-CORE-C-001"
  ],
  "sourceAnchor": {
    "documentId": "rfc-791",
    "section": "1.4",
    "heading": "1.4.  Operation",
    "normalizedTextSha256": "23c25ce2a0db18bef56df628369c133ca7e78b59df9ab32ff0c19c68b2651410"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Do not imply acknowledgments, retransmission, data error control, or flow control at the IPv4 layer.",
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
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
