---
id: "clause:WCMP-CL-GENERAL-ECHO-CORRELATION-FIELDS"
key: "WCMP-CL-GENERAL-ECHO-CORRELATION-FIELDS"
type: "clause"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Preserve the Echo Request Identifier and Sequence Number in the corresponding Echo Reply.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRX-008|RQ-TRX-008]]
- `planned-by` → [[work-items/TRN-703|TRN-703]]
- `planned-by` → [[work-items/TRN-710|TRN-710]]
- `refines` → [[scr-rows/WCMP-GEN-C-006|WCMP-GEN-C-006]]
- `sourced-from` → [[source-documents/WAP-202-WCMP|WAP-202-WCMP]]
- `verified-by` → [[fixtures/WCMP-FX-GENERAL-ECHO-CORRELATION-FIELDS|WCMP-FX-GENERAL-ECHO-CORRELATION-FIELDS]]

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
    "normalizedTextSha256": "a8b2ea352f2db3a3d2bf71eaea6b0fed94a858c3b3adac0488cc7839f061593f"
  },
  "normativeForce": "grammar",
  "obligationLevel": "required",
  "profileApplicability": "capability-gated-non-ip-bearer",
  "obligationSynopsis": "Preserve the Echo Request Identifier and Sequence Number in the corresponding Echo Reply.",
  "workItems": [
    "T0-17",
    "TRN-703",
    "TRN-710"
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
