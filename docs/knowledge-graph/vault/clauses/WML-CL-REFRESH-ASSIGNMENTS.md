---
id: "clause:WML-CL-REFRESH-ASSIGNMENTS"
key: "WML-CL-REFRESH-ASSIGNMENTS"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# For refresh, resolve and apply every setvar assignment without changing cards.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-002|RQ-RMK-002]]
- `maps-to` → [[requirements/RQ-RMK-003|RQ-RMK-003]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` → [[scr-rows/WML-C-18|WML-C-18]]
- `refines` → [[scr-rows/WML-C-42|WML-C-42]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-REFRESH-ASSIGNMENTS|WML-FX-REFRESH-ASSIGNMENTS]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-18",
    "WML-C-42"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "12.5.4",
    "heading": "12.5.4 The Refresh Task",
    "normalizedTextSha256": "897f1abc8b6eb63307f64eba8a12ca8bcd472af307585e5ded0d5371000f6ba9"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "For refresh, resolve and apply every setvar assignment without changing cards.",
  "workItems": [
    "R0-01",
    "R0-02",
    "WML-201"
  ],
  "ownerLayers": [
    "browser",
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-RMK-002",
    "RQ-RMK-003"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
