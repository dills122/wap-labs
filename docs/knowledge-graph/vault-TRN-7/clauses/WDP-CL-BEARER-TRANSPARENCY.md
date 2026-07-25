---
id: "clause:WDP-CL-BEARER-TRANSPARENCY"
key: "WDP-CL-BEARER-TRANSPARENCY"
type: "clause"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Keep bearer-specific mechanics below the transport service access point so upper layers can operate transparently.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-001|RQ-TRN-001]]
- `planned-by` → [[work-items/TRN-701|TRN-701]]
- `refines` → [[scr-rows/WDP-C-001|WDP-C-001]]
- `refines` → [[scr-rows/WDP-CORE-C-001|WDP-CORE-C-001]]
- `sourced-from` → [[source-documents/WAP-200-WDP|WAP-200-WDP]]
- `verified-by` → [[fixtures/WDP-FX-BEARER-TRANSPARENCY|WDP-FX-BEARER-TRANSPARENCY]]

## Data

```json
{
  "family": "wdp",
  "parentRows": [
    "WDP-C-001",
    "WDP-CORE-C-001"
  ],
  "sourceAnchor": {
    "documentId": "WAP-200-WDP",
    "section": "5.1",
    "heading": "5.1 Reference Model",
    "normalizedTextSha256": "4f53b4240fd7dd73c0e6803c1bf5cec5e6ae7e94b6378f81f6ec691e904e8de6"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Keep bearer-specific mechanics below the transport service access point so upper layers can operate transparently.",
  "workItems": [
    "T0-19",
    "TRN-701"
  ],
  "ownerLayers": [
    "transport-rust"
  ],
  "requirementIds": [
    "RQ-TRN-001"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
