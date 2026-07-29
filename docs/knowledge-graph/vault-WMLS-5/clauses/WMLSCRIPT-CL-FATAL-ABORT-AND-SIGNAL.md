---
id: "clause:WMLSCRIPT-CL-FATAL-ABORT-AND-SIGNAL"
key: "WMLSCRIPT-CL-FATAL-ABORT-AND-SIGNAL"
type: "clause"
generated: true
slice: "WMLS-5"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Abort the current WMLScript program on a fatal error and signal failure to the calling user agent.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WMLS-010|RQ-WMLS-010]]
- `planned-by` → [[work-items/WMLS-501|WMLS-501]]
- `planned-by` → [[work-items/WMLS-505|WMLS-505]]
- `refines` → [[scr-rows/WMLS-C-110|WMLS-C-110]]
- `sourced-from` → [[source-documents/WAP-193_101-WMLScript|WAP-193_101-WMLScript]]
- `verified-by` → [[fixtures/WMLSCRIPT-FX-FATAL-ABORT-AND-SIGNAL|WMLSCRIPT-FX-FATAL-ABORT-AND-SIGNAL]]

## Data

```json
{
  "family": "wmlscript",
  "parentRows": [
    "WMLS-C-110"
  ],
  "sourceAnchor": {
    "documentId": "WAP-193_101-WMLScript",
    "section": "12.3",
    "heading": "12.3 Fatal Errors",
    "normalizedTextSha256": "efe1ca5f21c501f5bf6da981ce26419b385b6ecf3f9b78318618e322b0b131cf"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Abort the current WMLScript program on a fatal error and signal failure to the calling user agent.",
  "workItems": [
    "W1-02",
    "W1-06",
    "W1-07",
    "WMLS-501",
    "WMLS-505"
  ],
  "ownerLayers": [
    "engine-wasm"
  ],
  "requirementIds": [
    "RQ-WMLS-010"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
