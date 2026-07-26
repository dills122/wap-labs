---
id: "clause:WSP-CL-EXPECT-SIN-ENCODING"
key: "WSP-CL-EXPECT-SIN-ENCODING"
type: "clause"
generated: true
slice: "WSP-8"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Apply the effective SIN 001 replacement grammar for the Expect header rather than the superseded base encoding.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-014|RQ-TRN-014]]
- `planned-by` → [[work-items/WSP-802|WSP-802]]
- `refines` → [[scr-rows/WSP-CL-C-003|WSP-CL-C-003]]
- `sourced-from` → [[source-documents/WAP-203_001-WSP|WAP-203_001-WSP]]
- `verified-by` → [[fixtures/WSP-FX-EXPECT-SIN-ENCODING|WSP-FX-EXPECT-SIN-ENCODING]]

## Data

```json
{
  "family": "wsp",
  "parentRows": [
    "WSP-CL-C-003"
  ],
  "sourceAnchor": {
    "documentId": "WAP-203_001-WSP",
    "section": "3.3",
    "heading": "3.3 Change",
    "normalizedTextSha256": "07f4be74bdbb8c95cd62c53284ec78d3636007db932efa899be4b2dd9f40f8c0"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Apply the effective SIN 001 replacement grammar for the Expect header rather than the superseded base encoding.",
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
