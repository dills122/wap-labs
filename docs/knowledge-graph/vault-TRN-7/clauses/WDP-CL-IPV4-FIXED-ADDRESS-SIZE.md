---
id: "clause:WDP-CL-IPV4-FIXED-ADDRESS-SIZE"
key: "WDP-CL-IPV4-FIXED-ADDRESS-SIZE"
type: "clause"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Represent each selected IPv4 source or destination address as four octets.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-003|RQ-TRN-003]]
- `planned-by` → [[work-items/TRN-701|TRN-701]]
- `refines` → [[scr-rows/WDP-NA-C-000|WDP-NA-C-000]]
- `refines` → [[scr-rows/WDP-NA-C-003|WDP-NA-C-003]]
- `sourced-from` → [[source-documents/rfc-791|rfc-791]]
- `verified-by` → [[fixtures/WDP-FX-IPV4-FIXED-ADDRESS-SIZE|WDP-FX-IPV4-FIXED-ADDRESS-SIZE]]

## Data

```json
{
  "family": "wdp",
  "parentRows": [
    "WDP-NA-C-000",
    "WDP-NA-C-003"
  ],
  "sourceAnchor": {
    "documentId": "rfc-791",
    "section": "2.3",
    "heading": "2.3.  Function Description",
    "normalizedTextSha256": "c49b5beb9925d741d2b57a5710fbebe5bae8a3d0197b4d6c649242eb138a8a0c"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Represent each selected IPv4 source or destination address as four octets.",
  "workItems": [
    "T0-19",
    "TRN-701"
  ],
  "ownerLayers": [
    "transport-rust"
  ],
  "requirementIds": [
    "RQ-TRN-003"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
