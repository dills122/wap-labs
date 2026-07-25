---
id: "clause:WDP-CL-UDP-IP-PROTOCOL-NUMBER"
key: "WDP-CL-UDP-IP-PROTOCOL-NUMBER"
type: "clause"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Identify UDP with IPv4 protocol number 17.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-002|RQ-TRN-002]]
- `maps-to` → [[requirements/RQ-TRN-003|RQ-TRN-003]]
- `planned-by` → [[work-items/TRN-701|TRN-701]]
- `refines` → [[scr-rows/WDP-CT-C-002|WDP-CT-C-002]]
- `refines` → [[scr-rows/WDP-NA-C-003|WDP-NA-C-003]]
- `sourced-from` → [[source-documents/rfc-768|rfc-768]]
- `verified-by` → [[fixtures/WDP-FX-UDP-IP-PROTOCOL-NUMBER|WDP-FX-UDP-IP-PROTOCOL-NUMBER]]

## Data

```json
{
  "family": "wdp",
  "parentRows": [
    "WDP-CT-C-002",
    "WDP-NA-C-003"
  ],
  "sourceAnchor": {
    "documentId": "rfc-768",
    "section": "protocol-number",
    "heading": "Protocol Number",
    "normalizedTextSha256": "69dfe158856a5a561553bbedf862c2e7bcf54395aa7603d54a61c6294b5e5141"
  },
  "normativeForce": "table",
  "obligationLevel": "required",
  "obligationSynopsis": "Identify UDP with IPv4 protocol number 17.",
  "workItems": [
    "T0-19",
    "TRN-701"
  ],
  "ownerLayers": [
    "transport-rust"
  ],
  "requirementIds": [
    "RQ-TRN-002",
    "RQ-TRN-003"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
