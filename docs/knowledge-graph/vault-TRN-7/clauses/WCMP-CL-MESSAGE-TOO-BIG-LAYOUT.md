---
id: "clause:WCMP-CL-MESSAGE-TOO-BIG-LAYOUT"
key: "WCMP-CL-MESSAGE-TOO-BIG-LAYOUT"
type: "clause"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Decode Message Too Big as Type 60, Code 0, original ports, destination address information, and a two-octet maximum message size.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRX-007|RQ-TRX-007]]
- `planned-by` → [[work-items/TRN-703|TRN-703]]
- `refines` → [[scr-rows/WCMP-GEN-C-003|WCMP-GEN-C-003]]
- `sourced-from` → [[source-documents/WAP-202-WCMP|WAP-202-WCMP]]
- `verified-by` → [[fixtures/WCMP-FX-MESSAGE-TOO-BIG-LAYOUT|WCMP-FX-MESSAGE-TOO-BIG-LAYOUT]]

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
    "normalizedTextSha256": "9f33eddb438a0a8a0a045dff96ca52fb0a00cb0970a7ce90e64c596588d6ee19"
  },
  "normativeForce": "grammar",
  "obligationLevel": "required",
  "obligationSynopsis": "Decode Message Too Big as Type 60, Code 0, original ports, destination address information, and a two-octet maximum message size.",
  "workItems": [
    "T0-17",
    "TRN-703"
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
