---
id: "clause:WMLSCRIPT-CL-LOCAL-VARIABLE-INDEXES"
key: "WMLSCRIPT-CL-LOCAL-VARIABLE-INDEXES"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Allocate local-variable indexes consecutively after the final argument index and match the declared local count.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-004|RQ-WMLS-004]]
- `maps-to` → [[requirements/RQ-WMLS-005|RQ-WMLS-005]]
- `planned-by` → [[work-items/WMLS-502|WMLS-502]]
- `refines` → [[scr-rows/WMLS-C-084|WMLS-C-084]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-LOCAL-VARIABLE-INDEXES|WMLSCRIPT-FX-LOCAL-VARIABLE-INDEXES]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-084"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "8.4.2",
    "heading": "8.4.2 Allocation of Variable Indexes",
    "normalizedTextSha256": "2ed271bf730407fb6bf4fbc5773615e51aaddc495449579f36f3cac82d731f68"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Allocate local-variable indexes consecutively after the final argument index and match the declared local count.",
  "workItems": [
    "W1-04",
    "WMLS-502"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-004",
    "RQ-WMLS-005"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
