---
id: "clause:WSP-CL-METHOD-RESULT-PARAMETERS"
key: "WSP-CL-METHOD-RESULT-PARAMETERS"
type: "clause"
generated: true
slice: "WSP-8"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Carry client address, server address, transaction identifier, status, optional response headers, and conditional response body in a method result.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-012|RQ-TRN-012]]
- `planned-by` → [[work-items/WSP-801|WSP-801]]
- `planned-by` → [[work-items/WSP-804|WSP-804]]
- `planned-by` → [[work-items/WSP-805|WSP-805]]
- `refines` → [[scr-rows/WSP-CL-C-005|WSP-CL-C-005]]
- `refines` → [[scr-rows/WSP-CL-C-007|WSP-CL-C-007]]
- `sourced-from` → [[source-documents/WAP-203-WSP|WAP-203-WSP]]
- `verified-by` → [[fixtures/WSP-FX-METHOD-RESULT-PARAMETERS|WSP-FX-METHOD-RESULT-PARAMETERS]]

## Data

```json
{
  "family": "wsp",
  "parentRows": [
    "WSP-CL-C-005",
    "WSP-CL-C-007"
  ],
  "sourceAnchor": {
    "documentId": "WAP-203-WSP",
    "section": "6.4.2.2",
    "heading": "6.4.2.2 S-Unit-MethodResult",
    "normalizedTextSha256": "085fcd2f79c30feb4fc459e128d2d7d067b9b8d9a36873850eb52acc86019721"
  },
  "normativeForce": "table",
  "obligationLevel": "required",
  "obligationSynopsis": "Carry client address, server address, transaction identifier, status, optional response headers, and conditional response body in a method result.",
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
