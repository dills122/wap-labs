---
id: "clause:WML-CL-ACCESS-RELATIVE-PATH"
key: "WML-CL-ACCESS-RELATIVE-PATH"
type: "clause"
generated: true
slice: "WML-3"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Resolve a relative access path to an absolute path before applying the prefix check.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-001|RQ-RMK-001]]
- `planned-by` → [[work-items/WML-306|WML-306]]
- `refines` → [[scr-rows/WML-C-21|WML-C-21]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-ACCESS-RELATIVE-PATH|WML-FX-ACCESS-RELATIVE-PATH]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-21"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "11.3.1",
    "heading": "11.3.1 The Access Element",
    "normalizedTextSha256": "105b4b3e7a77eec253ac220a6f9584aa6043bcf51e5298f6bb1bd4dedb7b8174"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Resolve a relative access path to an absolute path before applying the prefix check.",
  "workItems": [
    "C5-03",
    "R0-01",
    "R0-04",
    "WML-201",
    "WML-202",
    "WML-306"
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
