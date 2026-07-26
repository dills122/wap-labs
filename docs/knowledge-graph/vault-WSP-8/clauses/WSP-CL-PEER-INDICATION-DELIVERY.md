---
id: "clause:WSP-CL-PEER-INDICATION-DELIVERY"
key: "WSP-CL-PEER-INDICATION-DELIVERY"
type: "clause"
generated: true
slice: "WSP-8"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Deliver an indication primitive when the corresponding peer request primitive is received.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-010|RQ-TRN-010]]
- `planned-by` → [[work-items/WSP-801|WSP-801]]
- `refines` → [[scr-rows/WSP-CL-C-001|WSP-CL-C-001]]
- `sourced-from` → [[source-documents/WAP-203-WSP|WAP-203-WSP]]
- `verified-by` → [[fixtures/WSP-FX-PEER-INDICATION-DELIVERY|WSP-FX-PEER-INDICATION-DELIVERY]]

## Data

```json
{
  "family": "wsp",
  "parentRows": [
    "WSP-CL-C-001"
  ],
  "sourceAnchor": {
    "documentId": "WAP-203-WSP",
    "section": "6.4.3",
    "heading": "6.4.3 Constraints on Using the Service Primitives",
    "normalizedTextSha256": "62b37efab739dc9f20d640fb81134bb005be84d4b1e0dbc1eff74f3dcfb5c5c3"
  },
  "normativeForce": "explicit-should",
  "obligationLevel": "recommended",
  "obligationSynopsis": "Deliver an indication primitive when the corresponding peer request primitive is received.",
  "workItems": [
    "T0-09",
    "WSP-801"
  ],
  "ownerLayers": [
    "transport-rust"
  ],
  "requirementIds": [
    "RQ-TRN-010"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
