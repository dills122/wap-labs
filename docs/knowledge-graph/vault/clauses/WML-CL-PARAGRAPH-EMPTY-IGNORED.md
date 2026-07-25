---
id: "clause:WML-CL-PARAGRAPH-EMPTY-IGNORED"
key: "WML-CL-PARAGRAPH-EMPTY-IGNORED"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Ignore empty or whitespace-only paragraphs without allowing them to alter inherited wrap state.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-001|RQ-RMK-001]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` → [[scr-rows/WML-C-36|WML-C-36]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-PARAGRAPH-EMPTY-IGNORED|WML-FX-PARAGRAPH-EMPTY-IGNORED]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-36"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "11.8.3",
    "heading": "11.8.3 Paragraphs",
    "normalizedTextSha256": "21fe70f8d9d0409816f26bf1b15425fb1a5b48a3e1d8e1a065d18470cb9f1862"
  },
  "normativeForce": "explicit-should",
  "obligationLevel": "recommended",
  "obligationSynopsis": "Ignore empty or whitespace-only paragraphs without allowing them to alter inherited wrap state.",
  "workItems": [
    "R0-01",
    "R0-05",
    "WML-201"
  ],
  "ownerLayers": [
    "browser",
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-RMK-001"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
