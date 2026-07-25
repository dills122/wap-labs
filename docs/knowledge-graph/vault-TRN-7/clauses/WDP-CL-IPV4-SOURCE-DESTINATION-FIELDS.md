---
id: "clause:WDP-CL-IPV4-SOURCE-DESTINATION-FIELDS"
key: "WDP-CL-IPV4-SOURCE-DESTINATION-FIELDS"
type: "clause"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Preserve the 32-bit IPv4 source and destination header fields across the WDP request and indication boundary.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-001|RQ-TRN-001]]
- `maps-to` → [[requirements/RQ-TRN-003|RQ-TRN-003]]
- `planned-by` → [[work-items/TRN-701|TRN-701]]
- `refines` → [[scr-rows/WDP-NA-C-003|WDP-NA-C-003]]
- `refines` → [[scr-rows/WDP-PF-C-001|WDP-PF-C-001]]
- `refines` → [[scr-rows/WDP-PF-C-002|WDP-PF-C-002]]
- `sourced-from` → [[source-documents/rfc-791|rfc-791]]
- `verified-by` → [[fixtures/WDP-FX-IPV4-SOURCE-DESTINATION-FIELDS|WDP-FX-IPV4-SOURCE-DESTINATION-FIELDS]]

## Data

```json
{
  "family": "wdp",
  "parentRows": [
    "WDP-PF-C-001",
    "WDP-PF-C-002",
    "WDP-NA-C-003"
  ],
  "sourceAnchor": {
    "documentId": "rfc-791",
    "section": "3.1",
    "heading": "3.1.  Internet Header Format",
    "normalizedTextSha256": "bfbaa2d15de8326deed598572191088a85a154b2441b641f68b923ebc022656c"
  },
  "normativeForce": "table",
  "obligationLevel": "required",
  "obligationSynopsis": "Preserve the 32-bit IPv4 source and destination header fields across the WDP request and indication boundary.",
  "workItems": [
    "T0-19",
    "TRN-701"
  ],
  "ownerLayers": [
    "transport-rust"
  ],
  "requirementIds": [
    "RQ-TRN-001",
    "RQ-TRN-003"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
