---
id: "clause:WSP-CL-ENCODING-VERSION-TEXT-FORM"
key: "WSP-CL-ENCODING-VERSION-TEXT-FORM"
type: "clause"
generated: true
slice: "WSP-8"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Encode textual Encoding-Version as an optional code-page identity plus major-dot-minor version using the defined text-value rules.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-014|RQ-TRN-014]]
- `planned-by` → [[work-items/WSP-802|WSP-802]]
- `refines` → [[scr-rows/WSP-CL-C-020|WSP-CL-C-020]]
- `sourced-from` → [[source-documents/WAP-203-WSP|WAP-203-WSP]]
- `verified-by` → [[fixtures/WSP-FX-ENCODING-VERSION-TEXT-FORM|WSP-FX-ENCODING-VERSION-TEXT-FORM]]

## Data

```json
{
  "family": "wsp",
  "parentRows": [
    "WSP-CL-C-020"
  ],
  "sourceAnchor": {
    "documentId": "WAP-203-WSP",
    "section": "8.4.3.1",
    "heading": "8.4.3.1 Encoding-Version field",
    "normalizedTextSha256": "5d8ec7c2150505c15360af88c6fef4b8e56da6e0bbc747598001c7c730765756"
  },
  "normativeForce": "grammar",
  "obligationLevel": "required",
  "obligationSynopsis": "Encode textual Encoding-Version as an optional code-page identity plus major-dot-minor version using the defined text-value rules.",
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
