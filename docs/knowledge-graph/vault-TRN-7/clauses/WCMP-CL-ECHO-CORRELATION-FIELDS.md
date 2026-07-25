---
id: "clause:WCMP-CL-ECHO-CORRELATION-FIELDS"
key: "WCMP-CL-ECHO-CORRELATION-FIELDS"
type: "clause"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Preserve the request identifier and sequence number so an Echo Reply can be correlated with its Echo Request.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRX-008|RQ-TRX-008]]
- `planned-by` → [[work-items/TRN-703|TRN-703]]
- `refines` → [[scr-rows/WCMP-GEN-C-006|WCMP-GEN-C-006]]
- `sourced-from` → [[source-documents/WAP-202-WCMP|WAP-202-WCMP]]
- `verified-by` → [[fixtures/WCMP-FX-ECHO-CORRELATION-FIELDS|WCMP-FX-ECHO-CORRELATION-FIELDS]]

## Data

```json
{
  "family": "wcmp",
  "parentRows": [
    "WCMP-GEN-C-006"
  ],
  "sourceAnchor": {
    "documentId": "WAP-202-WCMP",
    "section": "5.5.3.5",
    "heading": "5.5.3.5. WCMP Echo Request/Reply",
    "normalizedTextSha256": "ca6566cbcb26aa763af02e6dd6732cd8a5c26910315e3a41d9a58219005b942b"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Preserve the request identifier and sequence number so an Echo Reply can be correlated with its Echo Request.",
  "workItems": [
    "T0-17",
    "TRN-703"
  ],
  "ownerLayers": [
    "transport-rust"
  ],
  "requirementIds": [
    "RQ-TRX-008"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
