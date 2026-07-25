---
id: "clause:WDP-CL-IPV4-ROBUST-INTEROPERATION"
key: "WDP-CL-IPV4-ROBUST-INTEROPERATION"
type: "clause"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Send well-formed IPv4 datagrams and accept every received datagram whose meaning can be interpreted safely.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-003|RQ-TRN-003]]
- `planned-by` → [[work-items/TRN-701|TRN-701]]
- `refines` → [[scr-rows/WDP-NA-C-003|WDP-NA-C-003]]
- `sourced-from` → [[source-documents/rfc-791|rfc-791]]
- `verified-by` → [[fixtures/WDP-FX-IPV4-ROBUST-INTEROPERATION|WDP-FX-IPV4-ROBUST-INTEROPERATION]]

## Data

```json
{
  "family": "wdp",
  "parentRows": [
    "WDP-NA-C-003"
  ],
  "sourceAnchor": {
    "documentId": "rfc-791",
    "section": "3.2",
    "heading": "3.2.  Discussion",
    "normalizedTextSha256": "b56c2040eaa3d2d2263a108063a3057a1c4291340111a3ad7b6e6b6928bb132e"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Send well-formed IPv4 datagrams and accept every received datagram whose meaning can be interpreted safely.",
  "workItems": [
    "T0-19",
    "TRN-701"
  ],
  "ownerLayers": [
    "transport-rust"
  ],
  "requirementIds": [
    "RQ-TRN-003"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
