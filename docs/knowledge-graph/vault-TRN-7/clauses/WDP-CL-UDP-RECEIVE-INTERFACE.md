---
id: "clause:WDP-CL-UDP-RECEIVE-INTERFACE"
key: "WDP-CL-UDP-RECEIVE-INTERFACE"
type: "clause"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Provide receive-port creation and return received data with its source IPv4 address and source port.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-001|RQ-TRN-001]]
- `maps-to` → [[requirements/RQ-TRN-003|RQ-TRN-003]]
- `planned-by` → [[work-items/TRN-701|TRN-701]]
- `refines` → [[scr-rows/WDP-NA-C-003|WDP-NA-C-003]]
- `refines` → [[scr-rows/WDP-NA-C-007|WDP-NA-C-007]]
- `refines` → [[scr-rows/WDP-PF-C-002|WDP-PF-C-002]]
- `sourced-from` → [[source-documents/rfc-768|rfc-768]]
- `verified-by` → [[fixtures/WDP-FX-UDP-RECEIVE-INTERFACE|WDP-FX-UDP-RECEIVE-INTERFACE]]

## Data

```json
{
  "family": "wdp",
  "parentRows": [
    "WDP-PF-C-002",
    "WDP-NA-C-003",
    "WDP-NA-C-007"
  ],
  "sourceAnchor": {
    "documentId": "rfc-768",
    "section": "interface",
    "heading": "User Interface",
    "normalizedTextSha256": "3f1b6b11ad266897a5181051c95c28ae15f002efd808e87a06cda33b63e76a01"
  },
  "normativeForce": "explicit-should",
  "obligationLevel": "recommended",
  "obligationSynopsis": "Provide receive-port creation and return received data with its source IPv4 address and source port.",
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
