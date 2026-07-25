---
id: "clause:WCMP-CL-ECHO-REPLY-RATE-LIMIT"
key: "WCMP-CL-ECHO-REPLY-RATE-LIMIT"
type: "clause"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Permit limits on generated Echo Replies to protect the node and bearer from overload or denial-of-service traffic.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRX-008|RQ-TRX-008]]
- `planned-by` → [[work-items/TRN-703|TRN-703]]
- `refines` → [[scr-rows/WCMP-GEN-C-006|WCMP-GEN-C-006]]
- `sourced-from` → [[source-documents/WAP-202-WCMP|WAP-202-WCMP]]
- `verified-by` → [[fixtures/WCMP-FX-ECHO-REPLY-RATE-LIMIT|WCMP-FX-ECHO-REPLY-RATE-LIMIT]]

## Data

```json
{
  "family": "wcmp",
  "parentRows": [
    "WCMP-GEN-C-006"
  ],
  "sourceAnchor": {
    "documentId": "WAP-202-WCMP",
    "section": "5.2",
    "heading": "5.2. WCMP Conformance",
    "normalizedTextSha256": "97e69bbf594e5040a2a1cef6baa24e7215852b0a63161e7d418aff45e54ded9b"
  },
  "normativeForce": "explicit-may",
  "obligationLevel": "permitted",
  "obligationSynopsis": "Permit limits on generated Echo Replies to protect the node and bearer from overload or denial-of-service traffic.",
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
