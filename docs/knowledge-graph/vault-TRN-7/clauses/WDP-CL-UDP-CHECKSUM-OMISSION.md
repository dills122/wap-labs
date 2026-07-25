---
id: "clause:WDP-CL-UDP-CHECKSUM-OMISSION"
key: "WDP-CL-UDP-CHECKSUM-OMISSION"
type: "clause"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Accept an all-zero UDP checksum field as the IPv4 sender choosing not to generate a UDP checksum.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-001|RQ-TRN-001]]
- `planned-by` → [[work-items/TRN-701|TRN-701]]
- `refines` → [[scr-rows/WDP-CORE-C-001|WDP-CORE-C-001]]
- `sourced-from` → [[source-documents/rfc-768|rfc-768]]
- `verified-by` → [[fixtures/WDP-FX-UDP-CHECKSUM-OMISSION|WDP-FX-UDP-CHECKSUM-OMISSION]]

## Data

```json
{
  "family": "wdp",
  "parentRows": [
    "WDP-CORE-C-001"
  ],
  "sourceAnchor": {
    "documentId": "rfc-768",
    "section": "fields",
    "heading": "Fields",
    "normalizedTextSha256": "bfed1df2e34a9e4b5f8cc0b80bf38ded0bbe519c09e3ab81e36d1804708f1f88"
  },
  "normativeForce": "explicit-may",
  "obligationLevel": "permitted",
  "obligationSynopsis": "Accept an all-zero UDP checksum field as the IPv4 sender choosing not to generate a UDP checksum.",
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
