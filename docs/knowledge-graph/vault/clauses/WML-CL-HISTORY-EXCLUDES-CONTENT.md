---
id: "clause:WML-CL-HISTORY-EXCLUDES-CONTENT"
key: "WML-CL-HISTORY-EXCLUDES-CONTENT"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Do not store card content in history entries.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-003|RQ-RMK-003]]
- `maps-to` → [[requirements/RQ-WAE-016|RQ-WAE-016]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` → [[scr-rows/WML-C-07|WML-C-07]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-HISTORY-EXCLUDES-CONTENT|WML-FX-HISTORY-EXCLUDES-CONTENT]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-07"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "9.2",
    "heading": "9.2 History",
    "normalizedTextSha256": "ddb05258d93542ece6bbeec4487a59dfc0da1b1afbf8a2979f59d5db6e8f8cf4"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Do not store card content in history entries.",
  "workItems": [
    "R0-01",
    "R0-03",
    "WML-201"
  ],
  "ownerLayers": [
    "browser",
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-RMK-003",
    "RQ-WAE-016"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
