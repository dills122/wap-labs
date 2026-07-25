---
id: "clause:WDP-CL-UDP-CHECKSUM-COVERAGE"
key: "WDP-CL-UDP-CHECKSUM-COVERAGE"
type: "clause"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Compute the UDP checksum over the IPv4 pseudo-header, UDP header, and data using 16-bit ones-complement arithmetic.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-001|RQ-TRN-001]]
- `maps-to` → [[requirements/RQ-TRN-003|RQ-TRN-003]]
- `planned-by` → [[work-items/TRN-701|TRN-701]]
- `refines` → [[scr-rows/WDP-CORE-C-001|WDP-CORE-C-001]]
- `refines` → [[scr-rows/WDP-NA-C-003|WDP-NA-C-003]]
- `sourced-from` → [[source-documents/rfc-768|rfc-768]]
- `verified-by` → [[fixtures/WDP-FX-UDP-CHECKSUM-COVERAGE|WDP-FX-UDP-CHECKSUM-COVERAGE]]

## Data

```json
{
  "family": "wdp",
  "parentRows": [
    "WDP-CORE-C-001",
    "WDP-NA-C-003"
  ],
  "sourceAnchor": {
    "documentId": "rfc-768",
    "section": "fields",
    "heading": "Fields",
    "normalizedTextSha256": "bfed1df2e34a9e4b5f8cc0b80bf38ded0bbe519c09e3ab81e36d1804708f1f88"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Compute the UDP checksum over the IPv4 pseudo-header, UDP header, and data using 16-bit ones-complement arithmetic.",
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
