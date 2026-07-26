---
id: "clause:WSP-CL-METHOD-BODY-CONSTRAINT"
key: "WSP-CL-METHOD-BODY-CONSTRAINT"
type: "clause"
generated: true
slice: "WSP-8"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Do not provide a request body when the invoked HTTP method does not permit an entity body.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-012|RQ-TRN-012]]
- `planned-by` → [[work-items/WSP-801|WSP-801]]
- `planned-by` → [[work-items/WSP-804|WSP-804]]
- `planned-by` → [[work-items/WSP-805|WSP-805]]
- `refines` → [[scr-rows/WSP-CL-C-004|WSP-CL-C-004]]
- `refines` → [[scr-rows/WSP-CL-C-006|WSP-CL-C-006]]
- `sourced-from` → [[source-documents/WAP-203-WSP|WAP-203-WSP]]
- `verified-by` → [[fixtures/WSP-FX-METHOD-BODY-CONSTRAINT|WSP-FX-METHOD-BODY-CONSTRAINT]]

## Data

```json
{
  "family": "wsp",
  "parentRows": [
    "WSP-CL-C-004",
    "WSP-CL-C-006"
  ],
  "sourceAnchor": {
    "documentId": "WAP-203-WSP",
    "section": "6.4.2.1",
    "heading": "6.4.2.1 S-Unit-MethodInvoke",
    "normalizedTextSha256": "c450fdef8df3c297f2806bc84918ae917a7a4a91fa84d440d57755fdf0e9ef45"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Do not provide a request body when the invoked HTTP method does not permit an entity body.",
  "workItems": [
    "T0-27",
    "T0-30",
    "WSP-801",
    "WSP-804",
    "WSP-805"
  ],
  "ownerLayers": [
    "transport-rust"
  ],
  "requirementIds": [
    "RQ-TRN-012"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
