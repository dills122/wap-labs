---
id: "clause:WDP-CL-IP-MAPPING-IS-UDP"
key: "WDP-CL-IP-MAPPING-IS-UDP"
type: "clause"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Map WDP directly to UDP for every selected bearer on which IP routing is available.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-001|RQ-TRN-001]]
- `maps-to` → [[requirements/RQ-TRN-002|RQ-TRN-002]]
- `maps-to` → [[requirements/RQ-TRN-003|RQ-TRN-003]]
- `planned-by` → [[work-items/TRN-701|TRN-701]]
- `refines` → [[scr-rows/WDP-C-001|WDP-C-001]]
- `refines` → [[scr-rows/WDP-CT-C-002|WDP-CT-C-002]]
- `refines` → [[scr-rows/WDP-NA-C-003|WDP-NA-C-003]]
- `sourced-from` → [[source-documents/WAP-200-WDP|WAP-200-WDP]]
- `verified-by` → [[fixtures/WDP-FX-IP-MAPPING-IS-UDP|WDP-FX-IP-MAPPING-IS-UDP]]

## Data

```json
{
  "family": "wdp",
  "parentRows": [
    "WDP-C-001",
    "WDP-CT-C-002",
    "WDP-NA-C-003"
  ],
  "sourceAnchor": {
    "documentId": "WAP-200-WDP",
    "section": "7.2",
    "heading": "7.2 Mapping of WDP for IP",
    "normalizedTextSha256": "4fb86371394022effc3e0a7a9881d64e7d03cc6bab673eb362db40b556d9cdbb"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Map WDP directly to UDP for every selected bearer on which IP routing is available.",
  "workItems": [
    "T0-19",
    "TRN-701"
  ],
  "ownerLayers": [
    "transport-rust"
  ],
  "requirementIds": [
    "RQ-TRN-001",
    "RQ-TRN-002",
    "RQ-TRN-003"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
