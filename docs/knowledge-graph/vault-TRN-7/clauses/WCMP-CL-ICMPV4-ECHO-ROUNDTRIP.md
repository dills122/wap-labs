---
id: "clause:WCMP-CL-ICMPV4-ECHO-ROUNDTRIP"
key: "WCMP-CL-ICMPV4-ECHO-ROUNDTRIP"
type: "clause"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Handle ICMPv4 Echo Request type 8 and Echo Reply type 0 with Code 0 while preserving the identifier, sequence number, and returned data.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRX-006|RQ-TRX-006]]
- `maps-to` → [[requirements/RQ-TRX-007|RQ-TRX-007]]
- `maps-to` → [[requirements/RQ-TRX-008|RQ-TRX-008]]
- `planned-by` → [[work-items/TRN-708|TRN-708]]
- `refines` → [[scr-rows/WCMP-SP-C-001|WCMP-SP-C-001]]
- `sourced-from` → [[source-documents/rfc-792|rfc-792]]
- `verified-by` → [[fixtures/WCMP-FX-ICMPV4-ECHO-ROUNDTRIP|WCMP-FX-ICMPV4-ECHO-ROUNDTRIP]]

## Data

```json
{
  "family": "wcmp",
  "parentRows": [
    "WCMP-SP-C-001"
  ],
  "sourceAnchor": {
    "documentId": "rfc-792",
    "section": "echo",
    "heading": "Echo or Echo Reply Message",
    "normalizedTextSha256": "8650244ca95dea984ab69dfbdbcd50fd2cd0893c10bf85cc74738a69fc049597"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Handle ICMPv4 Echo Request type 8 and Echo Reply type 0 with Code 0 while preserving the identifier, sequence number, and returned data.",
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
