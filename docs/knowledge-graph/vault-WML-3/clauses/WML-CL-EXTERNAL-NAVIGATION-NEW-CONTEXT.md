---
id: "clause:WML-CL-EXTERNAL-NAVIGATION-NEW-CONTEXT"
key: "WML-CL-EXTERNAL-NAVIGATION-NEW-CONTEXT"
type: "clause"
generated: true
slice: "WML-3"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Establish a new browser context when navigation is initiated independently of the current content.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-003|RQ-RMK-003]]
- `planned-by` → [[work-items/WML-301|WML-301]]
- `refines` → [[scr-rows/WML-C-13|WML-C-13]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-EXTERNAL-NAVIGATION-NEW-CONTEXT|WML-FX-EXTERNAL-NAVIGATION-NEW-CONTEXT]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-13"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "10.4",
    "heading": "10.4 Context Restrictions",
    "normalizedTextSha256": "e5ee7eef500beb419859b77972395ba710531497b9536f38dcc554980a9baba1"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Establish a new browser context when navigation is initiated independently of the current content.",
  "workItems": [
    "R0-01",
    "R0-03",
    "WML-201",
    "WML-301"
  ],
  "ownerLayers": [
    "browser",
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-RMK-003"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
