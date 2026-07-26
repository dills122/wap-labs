---
id: "clause:WML-CL-CARD-CONTEXT-ATTRIBUTE"
key: "WML-CL-CARD-CONTEXT-ATTRIBUTE"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Apply the card newcontext flag when entering through the defined go process.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-001|RQ-RMK-001]]
- `maps-to` → [[requirements/RQ-RMK-003|RQ-RMK-003]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `planned-by` → [[work-items/WML-202|WML-202]]
- `refines` → [[scr-rows/WML-C-11|WML-C-11]]
- `refines` → [[scr-rows/WML-C-25|WML-C-25]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-CARD-CONTEXT-ATTRIBUTE|WML-FX-CARD-CONTEXT-ATTRIBUTE]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-25",
    "WML-C-11"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "11.5.2",
    "heading": "11.5.2 The Card Element",
    "normalizedTextSha256": "f36c9181109d42ff77b92fd520fb3bcffc5b909d10f9eb4e1fd9cf43e7ffeca5"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Apply the card newcontext flag when entering through the defined go process.",
  "workItems": [
    "C5-03",
    "R0-01",
    "R0-03",
    "R0-04",
    "WML-201",
    "WML-202",
    "WML-301"
  ],
  "ownerLayers": [
    "browser",
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-RMK-001",
    "RQ-RMK-003"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
