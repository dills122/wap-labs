---
id: "clause:WSP-CL-HEADER-HTTP-COMPATIBILITY"
key: "WSP-CL-HEADER-HTTP-COMPATIBILITY"
type: "clause"
generated: true
slice: "WSP-8"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Encode WSP header fields as compact field-name/value pairs whose semantics remain compatible with HTTP/1.1.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-014|RQ-TRN-014]]
- `planned-by` → [[work-items/WSP-802|WSP-802]]
- `refines` → [[scr-rows/WSP-CL-C-003|WSP-CL-C-003]]
- `sourced-from` → [[source-documents/WAP-203-WSP|WAP-203-WSP]]
- `verified-by` → [[fixtures/WSP-FX-HEADER-HTTP-COMPATIBILITY|WSP-FX-HEADER-HTTP-COMPATIBILITY]]

## Data

```json
{
  "family": "wsp",
  "parentRows": [
    "WSP-CL-C-003"
  ],
  "sourceAnchor": {
    "documentId": "WAP-203-WSP",
    "section": "8.4.1",
    "heading": "8.4.1 General",
    "normalizedTextSha256": "f218a9a22f8fee9882d9ddc6d34a22d9c2f9f8675508f5ffde272d3bac08eeb2"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Encode WSP header fields as compact field-name/value pairs whose semantics remain compatible with HTTP/1.1.",
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
