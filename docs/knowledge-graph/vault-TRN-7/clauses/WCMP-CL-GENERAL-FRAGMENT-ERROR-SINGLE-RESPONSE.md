---
id: "clause:WCMP-CL-GENERAL-FRAGMENT-ERROR-SINGLE-RESPONSE"
key: "WCMP-CL-GENERAL-FRAGMENT-ERROR-SINGLE-RESPONSE"
type: "clause"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Send no more than one WCMP error message for a fragmented datagram.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRX-006|RQ-TRX-006]]
- `planned-by` → [[work-items/TRN-703|TRN-703]]
- `planned-by` → [[work-items/TRN-710|TRN-710]]
- `refines` → [[scr-rows/WCMP-SP-C-002|WCMP-SP-C-002]]
- `sourced-from` → [[source-documents/WAP-202-WCMP|WAP-202-WCMP]]
- `verified-by` → [[fixtures/WCMP-FX-GENERAL-FRAGMENT-ERROR-SINGLE-RESPONSE|WCMP-FX-GENERAL-FRAGMENT-ERROR-SINGLE-RESPONSE]]

## Data

```json
{
  "family": "wcmp",
  "parentRows": [
    "WCMP-SP-C-002"
  ],
  "sourceAnchor": {
    "documentId": "WAP-202-WCMP",
    "section": "5.1",
    "heading": "5.1. General",
    "normalizedTextSha256": "539f883bd387e0817c44f6f18d88a599de8b4194d7c9f262f7c25fb888f632f3"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "profileApplicability": "capability-gated-non-ip-bearer",
  "obligationSynopsis": "Send no more than one WCMP error message for a fragmented datagram.",
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
