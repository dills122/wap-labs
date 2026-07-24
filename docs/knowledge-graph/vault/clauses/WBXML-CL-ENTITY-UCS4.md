---
id: "clause:WBXML-CL-ENTITY-UCS4"
key: "WBXML-CL-ENTITY-UCS4"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Decode ENTITY followed by a multi-byte UCS-4 character value with XML numeric-entity semantics.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-007|RQ-RMK-007]]
- `maps-to` → [[requirements/RQ-RMK-010|RQ-RMK-010]]
- `planned-by` → [[work-items/WML-203|WML-203]]
- `refines` → [[scr-rows/WBXML-C-001|WBXML-C-001]]
- `sourced-from` → [[source-documents/WAP-192-WBXML|WAP-192-WBXML]]
- `verified-by` → [[fixtures/WBXML-FX-ENTITY-UCS4|WBXML-FX-ENTITY-UCS4]]

## Data

```json
{
  "family": "wbxml",
  "parentRows": [
    "WBXML-C-001"
  ],
  "sourceAnchor": {
    "documentId": "WAP-192-WBXML",
    "section": "5.8.4.3",
    "heading": "5.8.4.3. Character Entity",
    "normalizedTextSha256": "6ceb50b803c65b3146c807293ffd0b17d18d631ae1b6c1bcf72a870e527cb64c"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Decode ENTITY followed by a multi-byte UCS-4 character value with XML numeric-entity semantics.",
  "workItems": [
    "R0-08",
    "T0-07",
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
