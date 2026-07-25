---
id: "clause:WDP-CL-UDP-SOURCE-PORT-ZERO"
key: "WDP-CL-UDP-SOURCE-PORT-ZERO"
type: "clause"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Use source port zero when the sender does not supply a meaningful reply port, and otherwise preserve the selected source port.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-003|RQ-TRN-003]]
- `planned-by` → [[work-items/TRN-701|TRN-701]]
- `refines` → [[scr-rows/WDP-NA-C-007|WDP-NA-C-007]]
- `sourced-from` → [[source-documents/rfc-768|rfc-768]]
- `verified-by` → [[fixtures/WDP-FX-UDP-SOURCE-PORT-ZERO|WDP-FX-UDP-SOURCE-PORT-ZERO]]

## Data

```json
{
  "family": "wdp",
  "parentRows": [
    "WDP-NA-C-007"
  ],
  "sourceAnchor": {
    "documentId": "rfc-768",
    "section": "fields",
    "heading": "Fields",
    "normalizedTextSha256": "bfed1df2e34a9e4b5f8cc0b80bf38ded0bbe519c09e3ab81e36d1804708f1f88"
  },
  "normativeForce": "table",
  "obligationLevel": "required",
  "obligationSynopsis": "Use source port zero when the sender does not supply a meaningful reply port, and otherwise preserve the selected source port.",
  "workItems": [
    "T0-19",
    "TRN-701"
  ],
  "ownerLayers": [
    "transport-rust"
  ],
  "requirementIds": [
    "RQ-TRN-003"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
