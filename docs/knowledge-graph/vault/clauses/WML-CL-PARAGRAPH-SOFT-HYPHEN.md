---
id: "clause:WML-CL-PARAGRAPH-SOFT-HYPHEN"
key: "WML-CL-PARAGRAPH-SOFT-HYPHEN"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# When breaking at a soft hyphen, render a hyphen at line end; otherwise do not render that character as ordinary text.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-001|RQ-RMK-001]]
- `maps-to` → [[requirements/RQ-WAE-012|RQ-WAE-012]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` → [[scr-rows/WML-C-06|WML-C-06]]
- `refines` → [[scr-rows/WML-C-36|WML-C-36]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-PARAGRAPH-SOFT-HYPHEN|WML-FX-PARAGRAPH-SOFT-HYPHEN]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-36",
    "WML-C-06"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "11.8.3",
    "heading": "11.8.3 Paragraphs",
    "normalizedTextSha256": "21fe70f8d9d0409816f26bf1b15425fb1a5b48a3e1d8e1a065d18470cb9f1862"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "When breaking at a soft hyphen, render a hyphen at line end; otherwise do not render that character as ordinary text.",
  "workItems": [
    "C5-06",
    "R0-01",
    "R0-05",
    "R0-08",
    "WML-201",
    "WML-307"
  ],
  "ownerLayers": [
    "browser",
    "engine-wasm",
    "transport-rust"
  ],
  "requirementIds": [
    "RQ-RMK-001",
    "RQ-WAE-012"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
