---
id: "clause:WML-CL-IMAGE-ALT-FALLBACK"
key: "WML-CL-IMAGE-ALT-FALLBACK"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Render alt text when the image cannot be displayed because support, local data, or fetched content is unavailable.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-001|RQ-RMK-001]]
- `maps-to` → [[requirements/RQ-WAE-006|RQ-WAE-006]]
- `maps-to` → [[requirements/RQ-WAE-018|RQ-WAE-018]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` → [[scr-rows/WML-C-32|WML-C-32]]
- `refines` → [[scr-rows/WML-C-54|WML-C-54]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-IMAGE-ALT-FALLBACK|WML-FX-IMAGE-ALT-FALLBACK]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-32",
    "WML-C-54"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "11.9",
    "heading": "11.9 Images",
    "normalizedTextSha256": "bca5df51658dcc6e4057a1d621b2765f79b91fbde9dd84bf018a64f49200e35e"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Render alt text when the image cannot be displayed because support, local data, or fetched content is unavailable.",
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
    "RQ-RMK-001",
    "RQ-WAE-006",
    "RQ-WAE-018"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
