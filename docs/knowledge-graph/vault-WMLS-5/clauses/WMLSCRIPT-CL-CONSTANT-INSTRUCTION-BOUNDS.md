---
id: "clause:WMLSCRIPT-CL-CONSTANT-INSTRUCTION-BOUNDS"
key: "WMLSCRIPT-CL-CONSTANT-INSTRUCTION-BOUNDS"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Reject an indexed constant load that references outside the constant pool or an unsupported constant type.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-008|RQ-WMLS-008]]
- `maps-to` → [[requirements/RQ-WMLS-009|RQ-WMLS-009]]
- `planned-by` → [[work-items/WMLS-501|WMLS-501]]
- `planned-by` → [[work-items/WMLS-502|WMLS-502]]
- `planned-by` → [[work-items/WMLS-503|WMLS-503]]
- `refines` → [[scr-rows/WMLS-C-098|WMLS-C-098]]
- `refines` → [[scr-rows/WMLS-C-108|WMLS-C-108]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-CONSTANT-INSTRUCTION-BOUNDS|WMLSCRIPT-FX-CONSTANT-INSTRUCTION-BOUNDS]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-098",
    "WMLS-C-108"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "10.5.4",
    "heading": "10.5.4 Access To Constants",
    "normalizedTextSha256": "3de204f82ed82cffd4dcae2535cb06a4cd4fcdd04f1dc79ee4cf93deefa4c9b6"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Reject an indexed constant load that references outside the constant pool or an unsupported constant type.",
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
