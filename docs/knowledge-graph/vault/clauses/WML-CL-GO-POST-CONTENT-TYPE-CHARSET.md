---
id: "clause:WML-CL-GO-POST-CONTENT-TYPE-CHARSET"
key: "WML-CL-GO-POST-CONTENT-TYPE-CHARSET"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# For form-urlencoded POST, send encoded fields in the body and include the submission charset in Content-Type.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-002|RQ-RMK-002]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` → [[scr-rows/WML-C-29|WML-C-29]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]
- `verified-by` → [[fixtures/WML-FX-GO-POST-CONTENT-TYPE-CHARSET|WML-FX-GO-POST-CONTENT-TYPE-CHARSET]]

## Data

```json
{
  "family": "wml",
  "parentRows": [
    "WML-C-29"
  ],
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "section": "9.5.1",
    "heading": "9.5.1 The Go Element",
    "normalizedTextSha256": "90342941a32689afb2592233c1c1b0fd9f613ff59ef884eebbce0c792feedc12"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "For form-urlencoded POST, send encoded fields in the body and include the submission charset in Content-Type.",
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
