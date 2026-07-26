---
id: "clause:WML-CL-REFRESH-TIMER-RESTART"
key: "WML-CL-REFRESH-TIMER-RESTART"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Restart the current card timer during refresh after context updates.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-001|RQ-RMK-001]]
- `maps-to` → [[requirements/RQ-RMK-002|RQ-RMK-002]]
- `maps-to` → [[requirements/RQ-RMK-003|RQ-RMK-003]]
- `maps-to` → [[requirements/RQ-RMK-004|RQ-RMK-004]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` → [[scr-rows/WML-C-18|WML-C-18]]
- `refines` → [[scr-rows/WML-C-42|WML-C-42]]
- `refines` → [[scr-rows/WML-C-48|WML-C-48]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-REFRESH-TIMER-RESTART|WML-FX-REFRESH-TIMER-RESTART]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-18",
    "WML-C-42",
    "WML-C-48"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "12.5.4",
    "heading": "12.5.4 The Refresh Task",
    "normalizedTextSha256": "897f1abc8b6eb63307f64eba8a12ca8bcd472af307585e5ded0d5371000f6ba9"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Restart the current card timer during refresh after context updates.",
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
    "RQ-RMK-003",
    "RQ-RMK-004"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
