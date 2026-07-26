---
id: "clause:WSP-CL-REPLY-BODY-TO-SDU-END"
key: "WSP-CL-REPLY-BODY-TO-SDU-END"
type: "clause"
generated: true
slice: "WSP-8"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Treat every octet after the declared Reply headers as response body data through the end of the transport SDU.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-012|RQ-TRN-012]]
- `planned-by` → [[work-items/WSP-801|WSP-801]]
- `planned-by` → [[work-items/WSP-804|WSP-804]]
- `planned-by` → [[work-items/WSP-805|WSP-805]]
- `refines` → [[scr-rows/WSP-CL-C-005|WSP-CL-C-005]]
- `refines` → [[scr-rows/WSP-CL-C-007|WSP-CL-C-007]]
- `sourced-from` → [[source-documents/WAP-203-WSP|WAP-203-WSP]]
- `verified-by` → [[fixtures/WSP-FX-REPLY-BODY-TO-SDU-END|WSP-FX-REPLY-BODY-TO-SDU-END]]

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
    "section": "8.2.3.3",
    "heading": "8.2.3.3 Reply",
    "normalizedTextSha256": "1a3a46834cc478b5e8f40f65f923ae0abfc17ac4941e4fad772147cb69d8c29a"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Treat every octet after the declared Reply headers as response body data through the end of the transport SDU.",
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
