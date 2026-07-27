---
id: "clause:WML-CL-HISTORY-POST-REPLAY"
key: "WML-CL-HISTORY-POST-REPLAY"
type: "clause"
generated: true
slice: "WML-3"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# When a prior deck must be fetched again, replay the original POST data values associated with that history entry.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-002|RQ-RMK-002]]
- `maps-to` → [[requirements/RQ-RMK-003|RQ-RMK-003]]
- `maps-to` → [[requirements/RQ-WAE-016|RQ-WAE-016]]
- `planned-by` → [[work-items/WML-304|WML-304]]
- `refines` → [[scr-rows/WML-C-07|WML-C-07]]
- `refines` → [[scr-rows/WML-C-38|WML-C-38]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-HISTORY-POST-REPLAY|WML-FX-HISTORY-POST-REPLAY]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-07",
    "WML-C-38"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "9.2",
    "heading": "9.2 History",
    "normalizedTextSha256": "ddb05258d93542ece6bbeec4487a59dfc0da1b1afbf8a2979f59d5db6e8f8cf4"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "When a prior deck must be fetched again, replay the original POST data values associated with that history entry.",
  "workItems": [
    "R0-01",
    "R0-02",
    "R0-03",
    "WML-201",
    "WML-304"
  ],
  "ownerLayers": [
    "browser",
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-RMK-002",
    "RQ-RMK-003",
    "RQ-WAE-016"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
