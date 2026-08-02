---
id: "clause:WML-CL-LOW-MEMORY-CONTEXT-FAILURE-RESET"
key: "WML-CL-LOW-MEMORY-CONTEXT-FAILURE-RESET"
type: "clause"
generated: true
slice: "WML-3"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# If reclamation cannot satisfy the context limit, notify the user and reset the context to a documented predictable state.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `planned-by` → [[work-items/WML-306|WML-306]]
- `refines` → [[scr-rows/WML-C-15|WML-C-15]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-LOW-MEMORY-CONTEXT-FAILURE-RESET|WML-FX-LOW-MEMORY-CONTEXT-FAILURE-RESET]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-15"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "12.2.2",
    "heading": "12.2.2 Limited Browser Context Size",
    "normalizedTextSha256": "56b4cd8a388c0ac36a6379f3a9eeb0ee4f34e1c40e98718d1bcff7d2a9d66a0a"
  },
  "normativeForce": "explicit-should",
  "obligationLevel": "recommended",
  "profileApplicability": "optional-class-c-client-capability",
  "obligationSynopsis": "If reclamation cannot satisfy the context limit, notify the user and reset the context to a documented predictable state.",
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
