---
id: "clause:WCMP-CL-GENERAL-ADDRESS-INFORMATION-STRUCTURE"
key: "WCMP-CL-GENERAL-ADDRESS-INFORMATION-STRUCTURE"
type: "clause"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Encode address information as Address Type, Address Length, and the indicated number of Address Data octets.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRX-006|RQ-TRX-006]]
- `planned-by` → [[work-items/TRN-703|TRN-703]]
- `planned-by` → [[work-items/TRN-710|TRN-710]]
- `refines` → [[scr-rows/WCMP-SP-C-002|WCMP-SP-C-002]]
- `sourced-from` → [[source-documents/WAP-202-WCMP|WAP-202-WCMP]]
- `verified-by` → [[fixtures/WCMP-FX-GENERAL-ADDRESS-INFORMATION-STRUCTURE|WCMP-FX-GENERAL-ADDRESS-INFORMATION-STRUCTURE]]

## Data

```json
{
  "family": "wcmp",
  "parentRows": [
    "WCMP-SP-C-002"
  ],
  "sourceAnchor": {
    "documentId": "WAP-202-WCMP",
    "section": "5.5.2",
    "heading": "5.5.2. Address Information Formats",
    "normalizedTextSha256": "e9b34b18c16b0709752f28dd6cbf41b6d6e69a9efa094e586c17a9ed77cc8aaa"
  },
  "normativeForce": "grammar",
  "obligationLevel": "required",
  "profileApplicability": "capability-gated-non-ip-bearer",
  "obligationSynopsis": "Encode address information as Address Type, Address Length, and the indicated number of Address Data octets.",
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
