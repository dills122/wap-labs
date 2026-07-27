---
id: "clause:WAE-CL-WMLSCRIPTC-MEDIA-TYPE"
key: "WAE-CL-WMLSCRIPTC-MEDIA-TYPE"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Recognize application/vnd.wap.wmlscriptc as encoded WMLScript and route its bytecode to the WMLScript interpreter.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WAE-003|RQ-WAE-003]]
- `maps-to` → [[requirements/RQ-WMLS-011|RQ-WMLS-011]]
- `planned-by` → [[work-items/WMLS-503|WMLS-503]]
- `refines` → [[scr-rows/WAESpec-C-021|WAESpec-C-021]]
- `sourced-from` → [[source-documents/WAP-190-WAESpec|WAP-190-WAESpec]]
- `verified-by` → [[fixtures/WAE-FX-WMLSCRIPTC-MEDIA-TYPE|WAE-FX-WMLSCRIPTC-MEDIA-TYPE]]

## Data

```json
{
  "family": "wae",
  "parentRows": [
    "WAESpec-C-021"
  ],
  "sourceAnchor": {
    "documentId": "WAP-190-WAESpec",
    "section": "5.1.8.2",
    "heading": "5.1.8.2 Encoded WMLScript format",
    "normalizedTextSha256": "6d8c585b85bb7c55fa5ff2e457465067d981eaa7550ab13066043f447f81c354"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Recognize application/vnd.wap.wmlscriptc as encoded WMLScript and route its bytecode to the WMLScript interpreter.",
  "workItems": [
    "W1-01",
    "WMLS-503"
  ],
  "ownerLayers": [
    "browser",
    "engine-wasm",
    "transport-rust"
  ],
  "requirementIds": [
    "RQ-WAE-003",
    "RQ-WMLS-011"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
