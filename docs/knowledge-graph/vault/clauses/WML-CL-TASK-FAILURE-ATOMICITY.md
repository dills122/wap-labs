---
id: "clause:WML-CL-TASK-FAILURE-ATOMICITY"
key: "WML-CL-TASK-FAILURE-ATOMICITY"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# On fetch or access-control failure, notify the user and preserve the invoking card, context, pending assignments, and event state.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-002|RQ-RMK-002]]
- `maps-to` → [[requirements/RQ-RMK-003|RQ-RMK-003]]
- `maps-to` → [[requirements/RQ-RMK-012|RQ-RMK-012]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `planned-by` → [[work-items/WML-205|WML-205]]
- `refines` → [[scr-rows/WML-C-16|WML-C-16]]
- `refines` → [[scr-rows/WML-C-18|WML-C-18]]
- `refines` → [[scr-rows/WML-C-29|WML-C-29]]
- `refines` → [[scr-rows/WML-C-38|WML-C-38]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-TASK-FAILURE-ATOMICITY|WML-FX-TASK-FAILURE-ATOMICITY]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-16",
    "WML-C-18",
    "WML-C-29",
    "WML-C-38"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "12.5.5",
    "heading": "12.5.5 Task Execution Failure",
    "normalizedTextSha256": "7878c64b82aa89ca9f095e9ce72924245be0477b2cf69bee35a9efaa40edac71"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "On fetch or access-control failure, notify the user and preserve the invoking card, context, pending assignments, and event state.",
  "workItems": [
    "R0-01",
    "R0-02",
    "R0-06",
    "R0-07",
    "WML-201",
    "WML-205",
    "WML-303",
    "WML-306"
  ],
  "ownerLayers": [
    "browser",
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-RMK-002",
    "RQ-RMK-003",
    "RQ-RMK-012"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
