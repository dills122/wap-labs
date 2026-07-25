---
id: "clause:WCMP-CL-ICMPV4-CHECKSUM"
key: "WCMP-CL-ICMPV4-CHECKSUM"
type: "clause"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Encode and verify the ICMPv4 ones-complement checksum across the complete control message with the checksum field zeroed for calculation.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRX-006|RQ-TRX-006]]
- `maps-to` → [[requirements/RQ-TRX-007|RQ-TRX-007]]
- `maps-to` → [[requirements/RQ-TRX-008|RQ-TRX-008]]
- `planned-by` → [[work-items/TRN-708|TRN-708]]
- `refines` → [[scr-rows/WCMP-SP-C-001|WCMP-SP-C-001]]
- `sourced-from` → [[source-documents/rfc-792|rfc-792]]
- `verified-by` → [[fixtures/WCMP-FX-ICMPV4-CHECKSUM|WCMP-FX-ICMPV4-CHECKSUM]]

## Data

```json
{
  "family": "wcmp",
  "parentRows": [
    "WCMP-SP-C-001"
  ],
  "sourceAnchor": {
    "documentId": "rfc-792",
    "section": "message-formats",
    "heading": "Message Formats",
    "normalizedTextSha256": "a6e92e5b0b38344f6c280c15c846d7410b3601e73aa1c89c8d2a85eccf654ab5"
  },
  "normativeForce": "grammar",
  "obligationLevel": "required",
  "obligationSynopsis": "Encode and verify the ICMPv4 ones-complement checksum across the complete control message with the checksum field zeroed for calculation.",
  "workItems": [
    "TRN-708"
  ],
  "ownerLayers": [
    "transport-rust"
  ],
  "requirementIds": [
    "RQ-TRX-006",
    "RQ-TRX-007",
    "RQ-TRX-008"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
