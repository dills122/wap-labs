---
id: "clause:WCMP-CL-GENERAL-MESSAGE-TOO-BIG-STRUCTURE"
key: "WCMP-CL-GENERAL-MESSAGE-TOO-BIG-STRUCTURE"
type: "clause"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Encode Message Too Big with Type 60, Code 0, ports, address information, and the supported maximum message size.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRX-007|RQ-TRX-007]]
- `planned-by` → [[work-items/TRN-703|TRN-703]]
- `planned-by` → [[work-items/TRN-710|TRN-710]]
- `refines` → [[scr-rows/WCMP-GEN-C-003|WCMP-GEN-C-003]]
- `sourced-from` → [[source-documents/WAP-202-WCMP|WAP-202-WCMP]]
- `verified-by` → [[fixtures/WCMP-FX-GENERAL-MESSAGE-TOO-BIG-STRUCTURE|WCMP-FX-GENERAL-MESSAGE-TOO-BIG-STRUCTURE]]

## Data

```json
{
  "family": "wcmp",
  "parentRows": [
    "WCMP-GEN-C-003"
  ],
  "sourceAnchor": {
    "documentId": "WAP-202-WCMP",
    "section": "5.5.3.3",
    "heading": "5.5.3.3. Message Too Big",
    "normalizedTextSha256": "36ac87bfe1bdd8b7b2f428fc520e26a3646e24adf4187e5859974e97aca383b8"
  },
  "normativeForce": "grammar",
  "obligationLevel": "required",
  "profileApplicability": "capability-gated-non-ip-bearer",
  "obligationSynopsis": "Encode Message Too Big with Type 60, Code 0, ports, address information, and the supported maximum message size.",
  "workItems": [
    "T0-17",
    "TRN-703",
    "TRN-710"
  ],
  "ownerLayers": [
    "transport-rust"
  ],
  "requirementIds": [
    "RQ-TRX-007"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
