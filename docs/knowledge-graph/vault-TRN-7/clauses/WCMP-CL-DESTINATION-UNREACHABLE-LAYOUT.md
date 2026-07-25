---
id: "clause:WCMP-CL-DESTINATION-UNREACHABLE-LAYOUT"
key: "WCMP-CL-DESTINATION-UNREACHABLE-LAYOUT"
type: "clause"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Decode Destination Unreachable as Type, Code, original destination port, original originator port, and destination address information.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRX-006|RQ-TRX-006]]
- `planned-by` → [[work-items/TRN-703|TRN-703]]
- `refines` → [[scr-rows/WCMP-GEN-C-001|WCMP-GEN-C-001]]
- `sourced-from` → [[source-documents/WAP-202-WCMP|WAP-202-WCMP]]
- `verified-by` → [[fixtures/WCMP-FX-DESTINATION-UNREACHABLE-LAYOUT|WCMP-FX-DESTINATION-UNREACHABLE-LAYOUT]]

## Data

```json
{
  "family": "wcmp",
  "parentRows": [
    "WCMP-GEN-C-001"
  ],
  "sourceAnchor": {
    "documentId": "WAP-202-WCMP",
    "section": "5.5.3.1",
    "heading": "5.5.3.1. Destination Unreachable",
    "normalizedTextSha256": "16a71e4391d53b832f08dcde77b7f659ff61c392618175f8b3492894049efcf6"
  },
  "normativeForce": "grammar",
  "obligationLevel": "required",
  "obligationSynopsis": "Decode Destination Unreachable as Type, Code, original destination port, original originator port, and destination address information.",
  "workItems": [
    "T0-17",
    "TRN-703"
  ],
  "ownerLayers": [
    "transport-rust"
  ],
  "requirementIds": [
    "RQ-TRX-006"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
