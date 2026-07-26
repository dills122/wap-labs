---
id: "clause:WCMP-CL-GENERAL-PORT-UNREACHABLE-GENERATION"
key: "WCMP-CL-GENERAL-PORT-UNREACHABLE-GENERATION"
type: "clause"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Generate Destination Unreachable code 4 when no application is listening on the addressed destination port.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRX-006|RQ-TRX-006]]
- `planned-by` → [[work-items/TRN-703|TRN-703]]
- `planned-by` → [[work-items/TRN-710|TRN-710]]
- `refines` → [[scr-rows/WCMP-GEN-C-001|WCMP-GEN-C-001]]
- `sourced-from` → [[source-documents/WAP-202-WCMP|WAP-202-WCMP]]
- `verified-by` → [[fixtures/WCMP-FX-GENERAL-PORT-UNREACHABLE-GENERATION|WCMP-FX-GENERAL-PORT-UNREACHABLE-GENERATION]]

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
    "normalizedTextSha256": "4f499fabe3ce55ed88651b5aa782c6b232673082e1b94417cce0f69f54e28588"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "profileApplicability": "capability-gated-non-ip-bearer",
  "obligationSynopsis": "Generate Destination Unreachable code 4 when no application is listening on the addressed destination port.",
  "workItems": [
    "T0-17",
    "TRN-703",
    "TRN-710"
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
