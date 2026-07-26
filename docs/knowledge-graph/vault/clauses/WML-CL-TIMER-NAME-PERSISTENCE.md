---
id: "clause:WML-CL-TIMER-NAME-PERSISTENCE"
key: "WML-CL-TIMER-NAME-PERSISTENCE"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Store the current timer value in its name variable on card exit or expiration.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-001|RQ-RMK-001]]
- `maps-to` → [[requirements/RQ-RMK-004|RQ-RMK-004]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` → [[scr-rows/WML-C-48|WML-C-48]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-TIMER-NAME-PERSISTENCE|WML-FX-TIMER-NAME-PERSISTENCE]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-48"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "11.7",
    "heading": "11.7 The Timer Element",
    "normalizedTextSha256": "ff207e2a573c6f7562b0dd5e38623e09d7e9e811a71ea1ad7ae64fb1ef05fef0"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Store the current timer value in its name variable on card exit or expiration.",
  "workItems": [
    "R0-01",
    "R0-04",
    "WML-201",
    "WML-305"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-RMK-001",
    "RQ-RMK-004"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
