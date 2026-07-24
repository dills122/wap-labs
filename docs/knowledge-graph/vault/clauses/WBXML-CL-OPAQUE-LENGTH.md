---
id: "clause:WBXML-CL-OPAQUE-LENGTH"
key: "WBXML-CL-OPAQUE-LENGTH"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Decode OPAQUE as a multi-byte length followed by exactly that many application-specific bytes.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-007|RQ-RMK-007]]
- `maps-to` → [[requirements/RQ-RMK-010|RQ-RMK-010]]
- `planned-by` → [[work-items/WML-203|WML-203]]
- `refines` → [[scr-rows/WBXML-C-001|WBXML-C-001]]
- `sourced-from` → [[source-documents/WAP-192-WBXML|WAP-192-WBXML]]
- `verified-by` → [[fixtures/WBXML-FX-OPAQUE-LENGTH|WBXML-FX-OPAQUE-LENGTH]]

## Data

```json
{
  "family": "wbxml",
  "parentRows": [
    "WBXML-C-001"
  ],
  "sourceAnchor": {
    "documentId": "WAP-192-WBXML",
    "section": "5.8.4.6",
    "heading": "5.8.4.6. Opaque Data",
    "normalizedTextSha256": "f8262251f1703acc032db10fa8e4a40d888f234651782bceafdf11374c1bc7fb"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Decode OPAQUE as a multi-byte length followed by exactly that many application-specific bytes.",
  "workItems": [
    "R0-08",
    "T0-07",
    "WML-203"
  ],
  "ownerLayers": [
    "transport-rust"
  ],
  "requirementIds": [
    "RQ-RMK-007",
    "RQ-RMK-010"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
