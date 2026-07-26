---
id: "clause:WSP-CL-POST-CONTENT-TYPE"
key: "WSP-CL-POST-CONTENT-TYPE"
type: "clause"
generated: true
slice: "WSP-8"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Encode the Post body media type using the WSP Content-Type field-value grammar before the remaining headers.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-012|RQ-TRN-012]]
- `maps-to` → [[requirements/RQ-TRN-014|RQ-TRN-014]]
- `planned-by` → [[work-items/WSP-801|WSP-801]]
- `planned-by` → [[work-items/WSP-802|WSP-802]]
- `planned-by` → [[work-items/WSP-804|WSP-804]]
- `planned-by` → [[work-items/WSP-805|WSP-805]]
- `refines` → [[scr-rows/WSP-CL-C-003|WSP-CL-C-003]]
- `refines` → [[scr-rows/WSP-CL-C-006|WSP-CL-C-006]]
- `sourced-from` → [[source-documents/WAP-203-WSP|WAP-203-WSP]]
- `verified-by` → [[fixtures/WSP-FX-POST-CONTENT-TYPE|WSP-FX-POST-CONTENT-TYPE]]

## Data

```json
{
  "family": "wsp",
  "parentRows": [
    "WSP-CL-C-006",
    "WSP-CL-C-003"
  ],
  "sourceAnchor": {
    "documentId": "WAP-203-WSP",
    "section": "8.2.3.2",
    "heading": "8.2.3.2 Post",
    "normalizedTextSha256": "919cf5ad0be5f948be893725a2d738208d87a1c9b79d31ee619e6c3b030c399f"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Encode the Post body media type using the WSP Content-Type field-value grammar before the remaining headers.",
  "workItems": [
    "T0-20",
    "T0-27",
    "T0-30",
    "WSP-801",
    "WSP-802",
    "WSP-804",
    "WSP-805"
  ],
  "ownerLayers": [
    "transport-rust"
  ],
  "requirementIds": [
    "RQ-TRN-012",
    "RQ-TRN-014"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
