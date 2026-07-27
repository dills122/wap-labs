---
id: "clause:WMLSCRIPT-CL-MULTIBYTE-INTEGER-ORDER"
key: "WMLSCRIPT-CL-MULTIBYTE-INTEGER-ORDER"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Combine multi-byte integer octets and value bits in most-significant-group-first order.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-008|RQ-WMLS-008]]
- `planned-by` → [[work-items/WMLS-501|WMLS-501]]
- `refines` → [[scr-rows/WMLS-C-089|WMLS-C-089]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-MULTIBYTE-INTEGER-ORDER|WMLSCRIPT-FX-MULTIBYTE-INTEGER-ORDER]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-089"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "9.1.2",
    "heading": "9.1.2 Multi-byte Integer Format",
    "normalizedTextSha256": "22f68122c192e1640be93e009cc038221d04748be08a66406b84d917f084aa1d"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Combine multi-byte integer octets and value bits in most-significant-group-first order.",
  "workItems": [
    "W1-02",
    "WMLS-501"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-008"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
