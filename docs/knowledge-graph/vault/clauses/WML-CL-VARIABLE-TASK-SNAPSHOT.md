---
id: "clause:WML-CL-VARIABLE-TASK-SNAPSHOT"
key: "WML-CL-VARIABLE-TASK-SNAPSHOT"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Evaluate task setvar names and values before applying the resulting assignments to the browser context.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-002|RQ-RMK-002]]
- `maps-to` → [[requirements/RQ-RMK-003|RQ-RMK-003]]
- `maps-to` → [[requirements/RQ-RMK-005|RQ-RMK-005]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` → [[scr-rows/WML-C-12|WML-C-12]]
- `refines` → [[scr-rows/WML-C-18|WML-C-18]]
- `refines` → [[scr-rows/WML-C-29|WML-C-29]]
- `refines` → [[scr-rows/WML-C-38|WML-C-38]]
- `refines` → [[scr-rows/WML-C-42|WML-C-42]]
- `refines` → [[scr-rows/WML-C-52|WML-C-52]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-VARIABLE-TASK-SNAPSHOT|WML-FX-VARIABLE-TASK-SNAPSHOT]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-12",
    "WML-C-18",
    "WML-C-29",
    "WML-C-38",
    "WML-C-42",
    "WML-C-52"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "10.3.4",
    "heading": "10.3.4 Setting Variables",
    "normalizedTextSha256": "06c5e4be7633a32ca7e1c524c832663d5940f60f82bc3e371926ec76f535350d"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Evaluate task setvar names and values before applying the resulting assignments to the browser context.",
  "workItems": [
    "R0-01",
    "R0-02",
    "R0-03",
    "R0-06",
    "WML-201"
  ],
  "ownerLayers": [
    "browser",
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-RMK-002",
    "RQ-RMK-003",
    "RQ-RMK-005"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
