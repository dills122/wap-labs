---
id: "clause:WDP-CL-IPV4-HEADER-LAYOUT"
key: "WDP-CL-IPV4-HEADER-LAYOUT"
type: "clause"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Decode the complete IPv4 header field order and widths before passing its UDP payload to WDP.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-003|RQ-TRN-003]]
- `planned-by` → [[work-items/TRN-701|TRN-701]]
- `refines` → [[scr-rows/WDP-NA-C-003|WDP-NA-C-003]]
- `sourced-from` → [[source-documents/rfc-791|rfc-791]]
- `verified-by` → [[fixtures/WDP-FX-IPV4-HEADER-LAYOUT|WDP-FX-IPV4-HEADER-LAYOUT]]

## Data

```json
{
  "family": "wdp",
  "parentRows": [
    "WDP-NA-C-003"
  ],
  "sourceAnchor": {
    "documentId": "rfc-791",
    "section": "3.1",
    "heading": "3.1.  Internet Header Format",
    "normalizedTextSha256": "bfbaa2d15de8326deed598572191088a85a154b2441b641f68b923ebc022656c"
  },
  "normativeForce": "grammar",
  "obligationLevel": "required",
  "obligationSynopsis": "Decode the complete IPv4 header field order and widths before passing its UDP payload to WDP.",
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
