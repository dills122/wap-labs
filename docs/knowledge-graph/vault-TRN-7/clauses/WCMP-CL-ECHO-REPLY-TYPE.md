---
id: "clause:WCMP-CL-ECHO-REPLY-TYPE"
key: "WCMP-CL-ECHO-REPLY-TYPE"
type: "clause"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Use type 178 for Echo Request and type 179 for Echo Reply.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRX-008|RQ-TRX-008]]
- `planned-by` → [[work-items/TRN-703|TRN-703]]
- `refines` → [[scr-rows/WCMP-GEN-C-006|WCMP-GEN-C-006]]
- `sourced-from` → [[source-documents/WAP-202-WCMP|WAP-202-WCMP]]
- `verified-by` → [[fixtures/WCMP-FX-ECHO-REPLY-TYPE|WCMP-FX-ECHO-REPLY-TYPE]]

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
  "normativeForce": "table",
  "obligationLevel": "required",
  "obligationSynopsis": "Use type 178 for Echo Request and type 179 for Echo Reply.",
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
