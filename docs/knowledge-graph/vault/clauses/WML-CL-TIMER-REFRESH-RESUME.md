---
id: "clause:WML-CL-TIMER-REFRESH-RESUME"
key: "WML-CL-TIMER-REFRESH-RESUME"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Treat refresh as timer exit and re-entry: stop and persist the current value, update context, then resume.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-001|RQ-RMK-001]]
- `maps-to` → [[requirements/RQ-RMK-002|RQ-RMK-002]]
- `maps-to` → [[requirements/RQ-RMK-004|RQ-RMK-004]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` → [[scr-rows/WML-C-42|WML-C-42]]
- `refines` → [[scr-rows/WML-C-48|WML-C-48]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-TIMER-REFRESH-RESUME|WML-FX-TIMER-REFRESH-RESUME]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-48",
    "WML-C-42"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "11.7",
    "heading": "11.7 The Timer Element",
    "normalizedTextSha256": "ff207e2a573c6f7562b0dd5e38623e09d7e9e811a71ea1ad7ae64fb1ef05fef0"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Treat refresh as timer exit and re-entry: stop and persist the current value, update context, then resume.",
  "workItems": [
    "R0-01",
    "R0-02",
    "R0-04",
    "WML-201",
    "WML-305"
  ],
  "ownerLayers": [
    "browser",
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-RMK-001",
    "RQ-RMK-002",
    "RQ-RMK-004"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
