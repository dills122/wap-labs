---
id: "clause:WCMP-CL-GENERAL-TYPE-CLASSES"
key: "WCMP-CL-GENERAL-TYPE-CLASSES"
type: "clause"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Classify types 0 through 127 as errors, 128 through 191 as informational, and 192 through 255 as reserved.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRX-006|RQ-TRX-006]]
- `planned-by` → [[work-items/TRN-703|TRN-703]]
- `refines` → [[scr-rows/WCMP-SP-C-002|WCMP-SP-C-002]]
- `sourced-from` → [[source-documents/WAP-202-WCMP|WAP-202-WCMP]]
- `verified-by` → [[fixtures/WCMP-FX-GENERAL-TYPE-CLASSES|WCMP-FX-GENERAL-TYPE-CLASSES]]

## Data

```json
{
  "family": "wcmp",
  "parentRows": [
    "WCMP-SP-C-002"
  ],
  "sourceAnchor": {
    "documentId": "WAP-202-WCMP",
    "section": "5.5.1",
    "heading": "5.5.1. General Message Structure",
    "normalizedTextSha256": "19eaab848ccc4d8296d1c3389e34294e656e7dbcb9a61bb69ab28a2f178912f2"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Classify types 0 through 127 as errors, 128 through 191 as informational, and 192 through 255 as reserved.",
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
