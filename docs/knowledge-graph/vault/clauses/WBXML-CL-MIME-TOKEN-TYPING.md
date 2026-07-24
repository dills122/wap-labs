---
id: "clause:WBXML-CL-MIME-TOKEN-TYPING"
key: "WBXML-CL-MIME-TOKEN-TYPING"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# For WSP, HTTP, or SMTP transport, use the MIME media type as the token-value association key.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-RMK-007|RQ-RMK-007]]
- `maps-to` → [[requirements/RQ-RMK-010|RQ-RMK-010]]
- `planned-by` → [[work-items/WML-203|WML-203]]
- `refines` → [[scr-rows/WBXML-C-011|WBXML-C-011]]
- `sourced-from` → [[source-documents/WAP-192-WBXML|WAP-192-WBXML]]
- `verified-by` → [[fixtures/WBXML-FX-MIME-TOKEN-TYPING|WBXML-FX-MIME-TOKEN-TYPING]]

## Data

```json
{
  "family": "wbxml",
  "parentRows": [
    "WBXML-C-011"
  ],
  "sourceAnchor": {
    "documentId": "WAP-192-WBXML",
    "section": "6.4",
    "heading": "6.4. Associating XML Documents with WBXML Token Values",
    "normalizedTextSha256": "cc9de8f82b9972e8fd110e8decf68142d3f6bedaac5acc057c7bc468654c099a"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "For WSP, HTTP, or SMTP transport, use the MIME media type as the token-value association key.",
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
