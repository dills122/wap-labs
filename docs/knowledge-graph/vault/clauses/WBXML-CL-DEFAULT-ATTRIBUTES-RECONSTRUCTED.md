---
id: "clause:WBXML-CL-DEFAULT-ATTRIBUTES-RECONSTRUCTED"
key: "WBXML-CL-DEFAULT-ATTRIBUTES-RECONSTRUCTED"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Reconstruct omitted attribute values from the version-appropriate document-type defaults before presenting the decoded XML model.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-007|RQ-RMK-007]]
- `maps-to` → [[requirements/RQ-RMK-010|RQ-RMK-010]]
- `planned-by` → [[work-items/WML-203|WML-203]]
- `refines` → [[scr-rows/WBXML-C-010|WBXML-C-010]]
- `sourced-from` → [[source-documents/WAP-192-WBXML|WAP-192-WBXML]]
- `verified-by` → [[fixtures/WBXML-FX-DEFAULT-ATTRIBUTES-RECONSTRUCTED|WBXML-FX-DEFAULT-ATTRIBUTES-RECONSTRUCTED]]

## Data

```json
{
  "family": "wbxml",
  "parentRows": [
    "WBXML-C-010"
  ],
  "sourceAnchor": {
    "documentId": "WAP-192-WBXML",
    "section": "6.3",
    "heading": "6.3. Encoding Default Attribute Values",
    "normalizedTextSha256": "b711774ac56016f845ec78dfc29587b6014b1c8336df08eda5d0646c85a400e0"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Reconstruct omitted attribute values from the version-appropriate document-type defaults before presenting the decoded XML model.",
  "workItems": [
    "R0-08",
    "WML-203"
  ],
  "ownerLayers": [
    "transport-rust"
  ],
  "requirementIds": [
    "RQ-RMK-007",
    "RQ-RMK-010"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
