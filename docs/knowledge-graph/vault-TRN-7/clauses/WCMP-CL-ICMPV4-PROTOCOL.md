---
id: "clause:WCMP-CL-ICMPV4-PROTOCOL"
key: "WCMP-CL-ICMPV4-PROTOCOL"
type: "clause"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Carry ICMPv4 as IPv4 protocol number 1 and dispatch each control message from its leading Type field.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRX-006|RQ-TRX-006]]
- `maps-to` → [[requirements/RQ-TRX-007|RQ-TRX-007]]
- `maps-to` → [[requirements/RQ-TRX-008|RQ-TRX-008]]
- `planned-by` → [[work-items/TRN-708|TRN-708]]
- `refines` → [[scr-rows/WCMP-SP-C-001|WCMP-SP-C-001]]
- `sourced-from` → [[source-documents/rfc-792|rfc-792]]
- `verified-by` → [[fixtures/WCMP-FX-ICMPV4-PROTOCOL|WCMP-FX-ICMPV4-PROTOCOL]]

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
  "normativeForce": "table",
  "obligationLevel": "required",
  "obligationSynopsis": "Carry ICMPv4 as IPv4 protocol number 1 and dispatch each control message from its leading Type field.",
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
