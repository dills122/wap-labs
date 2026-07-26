---
id: "clause:WML-CL-NOOP-NO-PROCESSING"
key: "WML-CL-NOOP-NO-PROCESSING"
type: "clause"
generated: true
slice: "WML-3"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Perform no processing for a noop task.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-002|RQ-RMK-002]]
- `planned-by` → [[work-items/WML-303|WML-303]]
- `refines` → [[scr-rows/WML-C-35|WML-C-35]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-NOOP-NO-PROCESSING|WML-FX-NOOP-NO-PROCESSING]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-35"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "12.5.3",
    "heading": "12.5.3 The Noop Task",
    "normalizedTextSha256": "f9427d05f65d5b1ee5412759ea043513f68cfe0b354c0d331408ebbcb2f99d91"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Perform no processing for a noop task.",
  "workItems": [
    "R0-01",
    "R0-02",
    "WML-201",
    "WML-303"
  ],
  "ownerLayers": [
    "browser",
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-RMK-002"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
