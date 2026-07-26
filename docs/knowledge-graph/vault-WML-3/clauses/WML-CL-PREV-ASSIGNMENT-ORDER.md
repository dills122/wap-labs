---
id: "clause:WML-CL-PREV-ASSIGNMENT-ORDER"
key: "WML-CL-PREV-ASSIGNMENT-ORDER"
type: "clause"
generated: true
slice: "WML-3"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# For prev, snapshot setvar values, pop history, locate the destination, and then apply assignments.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-002|RQ-RMK-002]]
- `maps-to` → [[requirements/RQ-RMK-003|RQ-RMK-003]]
- `planned-by` → [[work-items/WML-302|WML-302]]
- `refines` → [[scr-rows/WML-C-18|WML-C-18]]
- `refines` → [[scr-rows/WML-C-38|WML-C-38]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-PREV-ASSIGNMENT-ORDER|WML-FX-PREV-ASSIGNMENT-ORDER]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-18",
    "WML-C-38"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "12.5.2",
    "heading": "12.5.2 The Prev Task",
    "normalizedTextSha256": "4c3633fc8ac91f591164d71491637c64794cba56ce4f4558abfe9e4070fec1fa"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "For prev, snapshot setvar values, pop history, locate the destination, and then apply assignments.",
  "workItems": [
    "R0-01",
    "R0-02",
    "WML-201",
    "WML-302"
  ],
  "ownerLayers": [
    "browser",
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-RMK-002",
    "RQ-RMK-003"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
