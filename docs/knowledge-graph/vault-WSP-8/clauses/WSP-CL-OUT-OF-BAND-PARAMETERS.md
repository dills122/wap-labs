---
id: "clause:WSP-CL-OUT-OF-BAND-PARAMETERS"
key: "WSP-CL-OUT-OF-BAND-PARAMETERS"
type: "clause"
generated: true
slice: "WSP-8"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Permit MRU and persistent-header settings to be agreed out of band, including by implication from a well-known server port.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-010|RQ-TRN-010]]
- `planned-by` → [[work-items/WSP-801|WSP-801]]
- `refines` → [[scr-rows/WSP-CL-C-001|WSP-CL-C-001]]
- `sourced-from` → [[source-documents/WAP-203-WSP|WAP-203-WSP]]
- `verified-by` → [[fixtures/WSP-FX-OUT-OF-BAND-PARAMETERS|WSP-FX-OUT-OF-BAND-PARAMETERS]]

## Data

```json
{
  "family": "wsp",
  "parentRows": [
    "WSP-CL-C-001"
  ],
  "sourceAnchor": {
    "documentId": "WAP-203-WSP",
    "section": "7.2",
    "heading": "7.2 Connectionless WSP",
    "normalizedTextSha256": "46b854c21e7aea34ecb93e11d204cafa6349651d7a3b27f8b0673633798f4e63"
  },
  "normativeForce": "explicit-may",
  "obligationLevel": "permitted",
  "obligationSynopsis": "Permit MRU and persistent-header settings to be agreed out of band, including by implication from a well-known server port.",
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
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
