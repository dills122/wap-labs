---
id: "clause:WCMP-CL-GENERAL-SELECTED-TYPE-CODE-VALUES"
key: "WCMP-CL-GENERAL-SELECTED-TYPE-CODE-VALUES"
type: "clause"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Use the specified Type and Code values for selected Destination Unreachable, Message Too Big, Echo Request, and Echo Reply messages.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRX-006|RQ-TRX-006]]
- `maps-to` → [[requirements/RQ-TRX-007|RQ-TRX-007]]
- `maps-to` → [[requirements/RQ-TRX-008|RQ-TRX-008]]
- `planned-by` → [[work-items/TRN-703|TRN-703]]
- `planned-by` → [[work-items/TRN-710|TRN-710]]
- `refines` → [[scr-rows/WCMP-GEN-C-001|WCMP-GEN-C-001]]
- `refines` → [[scr-rows/WCMP-GEN-C-003|WCMP-GEN-C-003]]
- `refines` → [[scr-rows/WCMP-GEN-C-006|WCMP-GEN-C-006]]
- `refines` → [[scr-rows/WCMP-SP-C-002|WCMP-SP-C-002]]
- `sourced-from` → [[source-documents/WAP-202-WCMP|WAP-202-WCMP]]
- `verified-by` → [[fixtures/WCMP-FX-GENERAL-SELECTED-TYPE-CODE-VALUES|WCMP-FX-GENERAL-SELECTED-TYPE-CODE-VALUES]]

## Data

```json
{
  "family": "wcmp",
  "parentRows": [
    "WCMP-SP-C-002",
    "WCMP-GEN-C-001",
    "WCMP-GEN-C-003",
    "WCMP-GEN-C-006"
  ],
  "sourceAnchor": {
    "documentId": "WAP-202-WCMP",
    "section": "5.5.1",
    "heading": "5.5.1. General Message Structure",
    "normalizedTextSha256": "a1a35edc0fc680fbd95779324d810e465dd3a131a3004e5ae7e0629d575fcd3a"
  },
  "normativeForce": "table",
  "obligationLevel": "required",
  "profileApplicability": "capability-gated-non-ip-bearer",
  "obligationSynopsis": "Use the specified Type and Code values for selected Destination Unreachable, Message Too Big, Echo Request, and Echo Reply messages.",
  "workItems": [
    "T0-17",
    "TRN-703",
    "TRN-710"
  ],
  "ownerLayers": [
    "transport-rust"
  ],
  "requirementIds": [
    "RQ-TRX-006",
    "RQ-TRX-007",
    "RQ-TRX-008"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
