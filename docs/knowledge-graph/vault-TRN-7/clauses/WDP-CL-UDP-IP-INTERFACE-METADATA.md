---
id: "clause:WDP-CL-UDP-IP-INTERFACE-METADATA"
key: "WDP-CL-UDP-IP-INTERFACE-METADATA"
type: "clause"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Make source address, destination address, and IP protocol metadata available at the UDP/IP boundary.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-001|RQ-TRN-001]]
- `maps-to` → [[requirements/RQ-TRN-003|RQ-TRN-003]]
- `planned-by` → [[work-items/TRN-701|TRN-701]]
- `refines` → [[scr-rows/WDP-CORE-C-001|WDP-CORE-C-001]]
- `refines` → [[scr-rows/WDP-NA-C-003|WDP-NA-C-003]]
- `sourced-from` → [[source-documents/rfc-768|rfc-768]]
- `verified-by` → [[fixtures/WDP-FX-UDP-IP-INTERFACE-METADATA|WDP-FX-UDP-IP-INTERFACE-METADATA]]

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
    "section": "ip-interface",
    "heading": "IP Interface",
    "normalizedTextSha256": "28a8d77d91839dd69df125c53d6297bb0a03aa3481cea6de6f46f6b65ebb6d95"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Make source address, destination address, and IP protocol metadata available at the UDP/IP boundary.",
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
