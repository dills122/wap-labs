---
id: "clause:WML-CL-LOW-MEMORY-HISTORY-MINIMUM"
key: "WML-CL-LOW-MEMORY-HISTORY-MINIMUM"
type: "clause"
generated: true
slice: "WML-3"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Provide a default history capacity of at least ten entries when the low-memory policy is enabled.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `planned-by` → [[work-items/WML-306|WML-306]]
- `refines` → [[scr-rows/WML-C-15|WML-C-15]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-LOW-MEMORY-HISTORY-MINIMUM|WML-FX-LOW-MEMORY-HISTORY-MINIMUM]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-15"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "12.2.1",
    "heading": "12.2.1 Limited History",
    "normalizedTextSha256": "7c8fa322a4b4058ae8677683a417e3b43d595240b3ef004d63e80d9459ec2189"
  },
  "normativeForce": "explicit-should",
  "obligationLevel": "recommended",
  "profileApplicability": "optional-class-c-client-capability",
  "obligationSynopsis": "Provide a default history capacity of at least ten entries when the low-memory policy is enabled.",
  "workItems": [
    "R0-01",
    "R0-07",
    "WML-306"
  ],
  "ownerLayers": [
    "engine-wasm",
    "browser"
  ],
  "requirementIds": [],
  "implementationStatus": "implemented",
  "evidenceGate": "Implemented optional Class C capability backed by source-derived WML-306 fixtures and direct engine/browser tests.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
