---
id: "clause:WCMP-CL-ICMPV4-PORT-UNREACHABLE"
key: "WCMP-CL-ICMPV4-PORT-UNREACHABLE"
type: "clause"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Interpret ICMPv4 Destination Unreachable type 3 code 3 as an inactive destination process port and map the quoted UDP destination port at the WDP boundary.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRX-006|RQ-TRX-006]]
- `maps-to` → [[requirements/RQ-TRX-007|RQ-TRX-007]]
- `maps-to` → [[requirements/RQ-TRX-008|RQ-TRX-008]]
- `planned-by` → [[work-items/TRN-708|TRN-708]]
- `refines` → [[scr-rows/WCMP-SP-C-001|WCMP-SP-C-001]]
- `sourced-from` → [[source-documents/rfc-792|rfc-792]]
- `verified-by` → [[fixtures/WCMP-FX-ICMPV4-PORT-UNREACHABLE|WCMP-FX-ICMPV4-PORT-UNREACHABLE]]

## Data

```json
{
  "family": "wcmp",
  "parentRows": [
    "WCMP-SP-C-001"
  ],
  "sourceAnchor": {
    "documentId": "rfc-792",
    "section": "destination-unreachable",
    "heading": "Destination Unreachable Message",
    "normalizedTextSha256": "380cb5a7362cd05dd7f4a7915b034f13a6d37a8409e67b590590f09bc040e8ca"
  },
  "normativeForce": "table",
  "obligationLevel": "required",
  "obligationSynopsis": "Interpret ICMPv4 Destination Unreachable type 3 code 3 as an inactive destination process port and map the quoted UDP destination port at the WDP boundary.",
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
