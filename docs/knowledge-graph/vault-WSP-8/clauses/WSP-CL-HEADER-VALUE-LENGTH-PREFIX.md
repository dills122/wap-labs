---
id: "clause:WSP-CL-HEADER-VALUE-LENGTH-PREFIX"
key: "WSP-CL-HEADER-VALUE-LENGTH-PREFIX"
type: "clause"
generated: true
slice: "WSP-8"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Interpret first-octet ranges as short length, uintvar-following length, NUL-terminated text, or terminal seven-bit encoded value.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-014|RQ-TRN-014]]
- `planned-by` → [[work-items/WSP-802|WSP-802]]
- `refines` → [[scr-rows/WSP-CL-C-003|WSP-CL-C-003]]
- `sourced-from` → [[source-documents/WAP-203-WSP|WAP-203-WSP]]
- `verified-by` → [[fixtures/WSP-FX-HEADER-VALUE-LENGTH-PREFIX|WSP-FX-HEADER-VALUE-LENGTH-PREFIX]]

## Data

```json
{
  "family": "wsp",
  "parentRows": [
    "WSP-CL-C-003"
  ],
  "sourceAnchor": {
    "documentId": "WAP-203-WSP",
    "section": "8.4.1.2",
    "heading": "8.4.1.2 Field values",
    "normalizedTextSha256": "7cb12ca3eb408871cbe99275fcd2067f36194b0034f6605ad4ce6438acf45ac9"
  },
  "normativeForce": "table",
  "obligationLevel": "required",
  "obligationSynopsis": "Interpret first-octet ranges as short length, uintvar-following length, NUL-terminated text, or terminal seven-bit encoded value.",
  "workItems": [
    "T0-20",
    "WSP-802"
  ],
  "ownerLayers": [
    "transport-rust"
  ],
  "requirementIds": [
    "RQ-TRN-014"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
