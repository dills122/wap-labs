---
id: "clause:WML-CL-POSTFIELD-REQUEST-PAIR"
key: "WML-CL-POSTFIELD-REQUEST-PAIR"
type: "clause"
generated: true
slice: "WML-3"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Submit each postfield as a name/value pair using the encoding selected by the enclosing go task.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-002|RQ-RMK-002]]
- `planned-by` → [[work-items/WML-304|WML-304]]
- `refines` → [[scr-rows/WML-C-29|WML-C-29]]
- `refines` → [[scr-rows/WML-C-37|WML-C-37]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-POSTFIELD-REQUEST-PAIR|WML-FX-POSTFIELD-REQUEST-PAIR]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-37",
    "WML-C-29"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "9.3",
    "heading": "9.3 The Postfield Element",
    "normalizedTextSha256": "6be6258eb35f3be917c7f3de2cddaeec4cf313cec93eb5cdfce07f49b400f9a6"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Submit each postfield as a name/value pair using the encoding selected by the enclosing go task.",
  "workItems": [
    "R0-01",
    "R0-02",
    "R0-06",
    "WML-201",
    "WML-304"
  ],
  "ownerLayers": [
    "browser",
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-RMK-002"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
