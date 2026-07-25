---
id: "clause:WDP-CL-APPLICATION-PORT-ADDRESSING"
key: "WDP-CL-APPLICATION-PORT-ADDRESSING"
type: "clause"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Provide source and destination port addressing for the higher-layer protocol or application above WDP.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-001|RQ-TRN-001]]
- `maps-to` → [[requirements/RQ-TRN-003|RQ-TRN-003]]
- `planned-by` → [[work-items/TRN-701|TRN-701]]
- `refines` → [[scr-rows/WDP-CORE-C-001|WDP-CORE-C-001]]
- `refines` → [[scr-rows/WDP-NA-C-006|WDP-NA-C-006]]
- `refines` → [[scr-rows/WDP-NA-C-007|WDP-NA-C-007]]
- `sourced-from` → [[source-documents/WAP-200-WDP|WAP-200-WDP]]
- `verified-by` → [[fixtures/WDP-FX-APPLICATION-PORT-ADDRESSING|WDP-FX-APPLICATION-PORT-ADDRESSING]]

## Data

```json
{
  "family": "wdp",
  "parentRows": [
    "WDP-CORE-C-001",
    "WDP-NA-C-006",
    "WDP-NA-C-007"
  ],
  "sourceAnchor": {
    "documentId": "WAP-200-WDP",
    "section": "5.1",
    "heading": "5.1 Reference Model",
    "normalizedTextSha256": "4f53b4240fd7dd73c0e6803c1bf5cec5e6ae7e94b6378f81f6ec691e904e8de6"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Provide source and destination port addressing for the higher-layer protocol or application above WDP.",
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
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
