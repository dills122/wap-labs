---
id: "clause:WBXML-CL-CHARSET-EXTERNAL-PRECEDENCE"
key: "WBXML-CL-CHARSET-EXTERNAL-PRECEDENCE"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# When external and internal charset metadata coexist, apply the precedence and conflict policy of the carrying protocol.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-007|RQ-RMK-007]]
- `maps-to` → [[requirements/RQ-RMK-010|RQ-RMK-010]]
- `planned-by` → [[work-items/WML-203|WML-203]]
- `refines` → [[scr-rows/WBXML-C-001|WBXML-C-001]]
- `sourced-from` → [[source-documents/WAP-192-WBXML|WAP-192-WBXML]]
- `verified-by` → [[fixtures/WBXML-FX-CHARSET-EXTERNAL-PRECEDENCE|WBXML-FX-CHARSET-EXTERNAL-PRECEDENCE]]

## Data

```json
{
  "family": "wbxml",
  "parentRows": [
    "WBXML-C-001"
  ],
  "sourceAnchor": {
    "documentId": "WAP-192-WBXML",
    "section": "5.2",
    "heading": "5.2. Character Encoding",
    "normalizedTextSha256": "d9b630bf107ba28639ca21183b5f79cc2820c8d90958024a4372190dfcc9fb2b"
  },
  "normativeForce": "explicit-should",
  "obligationLevel": "recommended",
  "obligationSynopsis": "When external and internal charset metadata coexist, apply the precedence and conflict policy of the carrying protocol.",
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
