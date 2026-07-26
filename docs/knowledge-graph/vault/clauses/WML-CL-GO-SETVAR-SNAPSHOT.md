---
id: "clause:WML-CL-GO-SETVAR-SNAPSHOT"
key: "WML-CL-GO-SETVAR-SNAPSHOT"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# For go, resolve setvar names and values into temporary assignments before fetching or changing context.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-002|RQ-RMK-002]]
- `maps-to` → [[requirements/RQ-RMK-003|RQ-RMK-003]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` → [[scr-rows/WML-C-18|WML-C-18]]
- `refines` → [[scr-rows/WML-C-29|WML-C-29]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-GO-SETVAR-SNAPSHOT|WML-FX-GO-SETVAR-SNAPSHOT]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-18",
    "WML-C-29"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "12.5.1",
    "heading": "12.5.1 The Go Task",
    "normalizedTextSha256": "64953475f2bdd343ead6d19fab5489ca50c840303fc961f186284ccef87bab9c"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "For go, resolve setvar names and values into temporary assignments before fetching or changing context.",
  "workItems": [
    "R0-01",
    "R0-02",
    "R0-06",
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
