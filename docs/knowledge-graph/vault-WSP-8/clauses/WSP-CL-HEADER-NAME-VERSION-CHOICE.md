---
id: "clause:WSP-CL-HEADER-NAME-VERSION-CHOICE"
key: "WSP-CL-HEADER-NAME-VERSION-CHOICE"
type: "clause"
generated: true
slice: "WSP-8"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Use a well-known field-name token only when its encoding version is supported; otherwise encode the field name as text.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-014|RQ-TRN-014]]
- `planned-by` → [[work-items/WSP-802|WSP-802]]
- `refines` → [[scr-rows/WSP-CL-C-003|WSP-CL-C-003]]
- `refines` → [[scr-rows/WSP-CL-C-020|WSP-CL-C-020]]
- `sourced-from` → [[source-documents/WAP-203-WSP|WAP-203-WSP]]
- `verified-by` → [[fixtures/WSP-FX-HEADER-NAME-VERSION-CHOICE|WSP-FX-HEADER-NAME-VERSION-CHOICE]]

## Data

```json
{
  "family": "wsp",
  "parentRows": [
    "WSP-CL-C-003",
    "WSP-CL-C-020"
  ],
  "sourceAnchor": {
    "documentId": "WAP-203-WSP",
    "section": "8.4.1.1",
    "heading": "8.4.1.1 Field name",
    "normalizedTextSha256": "1e30de32b1cefdee6ee7c77ea5c5e0139ccaea763d16a15f69da4aa52f98eead"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Use a well-known field-name token only when its encoding version is supported; otherwise encode the field name as text.",
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
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
