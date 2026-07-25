---
id: "clause:WDP-CL-IP-BEARER-REQUIRES-UDP"
key: "WDP-CL-IP-BEARER-REQUIRES-UDP"
type: "clause"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Use UDP as the WDP protocol whenever the selected bearer provides IP.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-001|RQ-TRN-001]]
- `maps-to` → [[requirements/RQ-TRN-002|RQ-TRN-002]]
- `maps-to` → [[requirements/RQ-TRN-003|RQ-TRN-003]]
- `planned-by` → [[work-items/TRN-701|TRN-701]]
- `planned-by` → [[work-items/TRN-707|TRN-707]]
- `refines` → [[scr-rows/WDP-C-001|WDP-C-001]]
- `refines` → [[scr-rows/WDP-CT-C-002|WDP-CT-C-002]]
- `refines` → [[scr-rows/WDP-NA-C-003|WDP-NA-C-003]]
- `sourced-from` → [[source-documents/WAP-200-WDP|WAP-200-WDP]]
- `verified-by` → [[fixtures/WDP-FX-IP-BEARER-REQUIRES-UDP|WDP-FX-IP-BEARER-REQUIRES-UDP]]

## Data

```json
{
  "family": "wdp",
  "parentRows": [
    "WDP-C-001",
    "WDP-CT-C-002",
    "WDP-NA-C-003"
  ],
  "sourceAnchor": {
    "documentId": "WAP-200-WDP",
    "section": "5.3",
    "heading": "5.3 WDP Static Conformance Clause",
    "normalizedTextSha256": "e7d1d717dda461baeb3dc8bc5692a2b672aa270ed1385e7946291857db16a4cf"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Use UDP as the WDP protocol whenever the selected bearer provides IP.",
  "workItems": [
    "T0-19",
    "TRN-701",
    "TRN-707"
  ],
  "ownerLayers": [
    "transport-rust"
  ],
  "requirementIds": [
    "RQ-TRN-001",
    "RQ-TRN-002",
    "RQ-TRN-003"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
