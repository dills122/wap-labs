---
id: "clause:WML-CL-NAVIGATION-REFERENCE-MODEL"
key: "WML-CL-NAVIGATION-REFERENCE-MODEL"
type: "clause"
generated: true
slice: "WML-3"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Implement inter-card traversal with behavior indistinguishable from the WML reference process.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-003|RQ-RMK-003]]
- `planned-by` → [[work-items/WML-301|WML-301]]
- `refines` → [[scr-rows/WML-C-18|WML-C-18]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-NAVIGATION-REFERENCE-MODEL|WML-FX-NAVIGATION-REFERENCE-MODEL]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-18"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "12.5",
    "heading": "12.5 Reference Processing Behaviour - Inter-card Navigation",
    "normalizedTextSha256": "9d6c24753480550e18c41664ebb7eca840522fc81c47410be3207afcd2f81333"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Implement inter-card traversal with behavior indistinguishable from the WML reference process.",
  "workItems": [
    "R0-01",
    "R0-02",
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
