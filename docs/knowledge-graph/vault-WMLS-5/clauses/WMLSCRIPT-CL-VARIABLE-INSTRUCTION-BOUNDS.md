---
id: "clause:WMLSCRIPT-CL-VARIABLE-INSTRUCTION-BOUNDS"
key: "WMLSCRIPT-CL-VARIABLE-INSTRUCTION-BOUNDS"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Reject a variable instruction whose index is outside the current function argument-and-local variable range.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-008|RQ-WMLS-008]]
- `maps-to` → [[requirements/RQ-WMLS-009|RQ-WMLS-009]]
- `planned-by` → [[work-items/WMLS-501|WMLS-501]]
- `planned-by` → [[work-items/WMLS-502|WMLS-502]]
- `planned-by` → [[work-items/WMLS-503|WMLS-503]]
- `refines` → [[scr-rows/WMLS-C-097|WMLS-C-097]]
- `refines` → [[scr-rows/WMLS-C-108|WMLS-C-108]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-VARIABLE-INSTRUCTION-BOUNDS|WMLSCRIPT-FX-VARIABLE-INSTRUCTION-BOUNDS]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-097",
    "WMLS-C-108"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "10.5.3",
    "heading": "10.5.3 Variable Access and Manipulation",
    "normalizedTextSha256": "5ae5976678204f8cf261eb06ddfb0e0ae72a32c1511d9ca78d49d4432d52c215"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Reject a variable instruction whose index is outside the current function argument-and-local variable range.",
  "workItems": [
    "W1-02",
    "W1-03",
    "W1-04",
    "W1-05",
    "WMLS-501",
    "WMLS-502",
    "WMLS-503"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-008",
    "RQ-WMLS-009"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
