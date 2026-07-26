---
id: "clause:WSP-CL-PRIMITIVE-ROLE-RESTRICTIONS"
key: "WSP-CL-PRIMITIVE-ROLE-RESTRICTIONS"
type: "clause"
generated: true
slice: "WSP-8"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Allow clients to request method invocation and receive results while allowing servers to receive invocations and request results.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-010|RQ-TRN-010]]
- `maps-to` → [[requirements/RQ-TRN-012|RQ-TRN-012]]
- `planned-by` → [[work-items/WSP-801|WSP-801]]
- `planned-by` → [[work-items/WSP-804|WSP-804]]
- `planned-by` → [[work-items/WSP-805|WSP-805]]
- `refines` → [[scr-rows/WSP-CL-C-001|WSP-CL-C-001]]
- `refines` → [[scr-rows/WSP-CL-C-004|WSP-CL-C-004]]
- `refines` → [[scr-rows/WSP-CL-C-005|WSP-CL-C-005]]
- `refines` → [[scr-rows/WSP-CL-C-006|WSP-CL-C-006]]
- `refines` → [[scr-rows/WSP-CL-C-007|WSP-CL-C-007]]
- `sourced-from` → [[source-documents/WAP-203-WSP|WAP-203-WSP]]
- `verified-by` → [[fixtures/WSP-FX-PRIMITIVE-ROLE-RESTRICTIONS|WSP-FX-PRIMITIVE-ROLE-RESTRICTIONS]]

## Data

```json
{
  "family": "wsp",
  "parentRows": [
    "WSP-CL-C-001",
    "WSP-CL-C-004",
    "WSP-CL-C-005",
    "WSP-CL-C-006",
    "WSP-CL-C-007"
  ],
  "sourceAnchor": {
    "documentId": "WAP-203-WSP",
    "section": "6.4.3",
    "heading": "6.4.3 Constraints on Using the Service Primitives",
    "normalizedTextSha256": "62b37efab739dc9f20d640fb81134bb005be84d4b1e0dbc1eff74f3dcfb5c5c3"
  },
  "normativeForce": "grammar",
  "obligationLevel": "required",
  "obligationSynopsis": "Allow clients to request method invocation and receive results while allowing servers to receive invocations and request results.",
  "workItems": [
    "T0-09",
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
    "RQ-TRN-010",
    "RQ-TRN-012"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
