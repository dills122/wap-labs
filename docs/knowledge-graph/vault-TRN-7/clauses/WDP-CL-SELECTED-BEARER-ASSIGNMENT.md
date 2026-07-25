---
id: "clause:WDP-CL-SELECTED-BEARER-ASSIGNMENT"
key: "WDP-CL-SELECTED-BEARER-ASSIGNMENT"
type: "clause"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Represent the AMPS/CDPD/IPv4 network-bearer-address combination with assigned bearer value 0x0D when that registry is carried.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-002|RQ-TRN-002]]
- `maps-to` → [[requirements/RQ-TRN-003|RQ-TRN-003]]
- `planned-by` → [[work-items/TRN-701|TRN-701]]
- `refines` → [[scr-rows/WDP-CT-C-002|WDP-CT-C-002]]
- `refines` → [[scr-rows/WDP-NA-C-003|WDP-NA-C-003]]
- `sourced-from` → [[source-documents/WAP-200-WDP|WAP-200-WDP]]
- `verified-by` → [[fixtures/WDP-FX-SELECTED-BEARER-ASSIGNMENT|WDP-FX-SELECTED-BEARER-ASSIGNMENT]]

## Data

```json
{
  "family": "wdp",
  "parentRows": [
    "WDP-CT-C-002",
    "WDP-NA-C-003"
  ],
  "sourceAnchor": {
    "documentId": "WAP-200-WDP",
    "section": "appendix-c",
    "heading": "Appendix C: Bearer Type Assignments",
    "normalizedTextSha256": "21ce525fc14b3d0a2832842c4205e652d3ee02ad3d7debedd80e1a639e93c5e1"
  },
  "normativeForce": "table",
  "obligationLevel": "required",
  "obligationSynopsis": "Represent the AMPS/CDPD/IPv4 network-bearer-address combination with assigned bearer value 0x0D when that registry is carried.",
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
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
