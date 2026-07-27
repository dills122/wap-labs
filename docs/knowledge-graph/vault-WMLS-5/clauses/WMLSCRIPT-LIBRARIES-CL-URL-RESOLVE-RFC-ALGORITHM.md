---
id: "clause:WMLSCRIPT-LIBRARIES-CL-URL-RESOLVE-RFC-ALGORITHM"
key: "WMLSCRIPT-LIBRARIES-CL-URL-RESOLVE-RFC-ALGORITHM"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Apply the RFC 2396 section 5.2 component-inheritance, path merge, dot-segment, query, and fragment resolution algorithm.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-016|RQ-WMLS-016]]
- `planned-by` → [[work-items/WMLS-504|WMLS-504]]
- `refines` → [[scr-rows/WMLSSL-081|WMLSSL-081]]
- `sourced-from` → [[source-documents/rfc-2396|rfc-2396]]
- `verified-by` → [[fixtures/WMLSCRIPT-LIBRARIES-FX-URL-RESOLVE-RFC-ALGORITHM|WMLSCRIPT-LIBRARIES-FX-URL-RESOLVE-RFC-ALGORITHM]]

## Data

```json
{
  "family": "wmlscript-libraries",
  "parentRows": [
    "WMLSSL-081"
  ],
  "sourceAnchor": {
    "documentId": "rfc-2396",
    "section": "5.2",
    "heading": "5.2. Resolving Relative References to Absolute Form",
    "normalizedTextSha256": "eaf601f6a9344cc32a8953766f58d6028f15788a7b82c5da783f13caad2c2404"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Apply the RFC 2396 section 5.2 component-inheritance, path merge, dot-segment, query, and fragment resolution algorithm.",
  "workItems": [
    "W1-05",
    "WMLS-504"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-016"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
