---
id: "clause:WSP-CL-REPLY-CONTENT-TYPE"
key: "WSP-CL-REPLY-CONTENT-TYPE"
type: "clause"
generated: true
slice: "WSP-8"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Decode the Reply body media type before the remaining response headers.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-012|RQ-TRN-012]]
- `maps-to` → [[requirements/RQ-TRN-014|RQ-TRN-014]]
- `planned-by` → [[work-items/WSP-801|WSP-801]]
- `planned-by` → [[work-items/WSP-802|WSP-802]]
- `planned-by` → [[work-items/WSP-804|WSP-804]]
- `planned-by` → [[work-items/WSP-805|WSP-805]]
- `refines` → [[scr-rows/WSP-CL-C-003|WSP-CL-C-003]]
- `refines` → [[scr-rows/WSP-CL-C-005|WSP-CL-C-005]]
- `refines` → [[scr-rows/WSP-CL-C-007|WSP-CL-C-007]]
- `sourced-from` → [[source-documents/WAP-203-WSP|WAP-203-WSP]]
- `verified-by` → [[fixtures/WSP-FX-REPLY-CONTENT-TYPE|WSP-FX-REPLY-CONTENT-TYPE]]

## Data

```json
{
  "family": "wsp",
  "parentRows": [
    "WSP-CL-C-005",
    "WSP-CL-C-007",
    "WSP-CL-C-003"
  ],
  "sourceAnchor": {
    "documentId": "WAP-203-WSP",
    "section": "8.2.3.3",
    "heading": "8.2.3.3 Reply",
    "normalizedTextSha256": "1a3a46834cc478b5e8f40f65f923ae0abfc17ac4941e4fad772147cb69d8c29a"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Decode the Reply body media type before the remaining response headers.",
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
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
