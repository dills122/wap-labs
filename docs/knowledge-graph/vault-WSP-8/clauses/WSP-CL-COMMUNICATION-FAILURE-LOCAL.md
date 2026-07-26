---
id: "clause:WSP-CL-COMMUNICATION-FAILURE-LOCAL"
key: "WSP-CL-COMMUNICATION-FAILURE-LOCAL"
type: "clause"
generated: true
slice: "WSP-8"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Generate no peer indication when a request cannot be communicated and handle exceptional conditions as a local implementation matter.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-010|RQ-TRN-010]]
- `planned-by` → [[work-items/WSP-801|WSP-801]]
- `refines` → [[scr-rows/WSP-CL-C-001|WSP-CL-C-001]]
- `sourced-from` → [[source-documents/WAP-203-WSP|WAP-203-WSP]]
- `verified-by` → [[fixtures/WSP-FX-COMMUNICATION-FAILURE-LOCAL|WSP-FX-COMMUNICATION-FAILURE-LOCAL]]

## Data

```json
{
  "family": "wsp",
  "parentRows": [
    "WSP-CL-C-001"
  ],
  "sourceAnchor": {
    "documentId": "WAP-203-WSP",
    "section": "6.4.4",
    "heading": "6.4.4 Error Handling",
    "normalizedTextSha256": "4776ad6fc6616c041b61a4bce3e63a2b5d7e5435ea2d5ba4488428d5e5990d6d"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Generate no peer indication when a request cannot be communicated and handle exceptional conditions as a local implementation matter.",
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
