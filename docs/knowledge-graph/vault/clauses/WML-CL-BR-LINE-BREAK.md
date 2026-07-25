---
id: "clause:WML-CL-BR-LINE-BREAK"
key: "WML-CL-BR-LINE-BREAK"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# End the current rendered line at br and continue on the following line.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-001|RQ-RMK-001]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` → [[scr-rows/WML-C-24|WML-C-24]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-BR-LINE-BREAK|WML-FX-BR-LINE-BREAK]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-24"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "11.8.4",
    "heading": "11.8.4 The Br Element",
    "normalizedTextSha256": "04a782c3e912f6167be9e3240597019fc2185e0aabac294e839a74bc4047ceb3"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "End the current rendered line at br and continue on the following line.",
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
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
