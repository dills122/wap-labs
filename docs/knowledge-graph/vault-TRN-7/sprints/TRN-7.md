---
id: "sprint:TRN-7"
key: "TRN-7"
type: "sprint"
generated: true
slice: "TRN-7"
status: "in-progress"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/sprint"
---

# WDP, WCMP, and conditional WTP Class C transport core

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `contains` → [[work-items/TRN-701|TRN-701]]
- `contains` → [[work-items/TRN-702|TRN-702]]
- `contains` → [[work-items/TRN-703|TRN-703]]
- `contains` → [[work-items/TRN-704|TRN-704]]
- `contains` → [[work-items/TRN-705|TRN-705]]
- `contains` → [[work-items/TRN-706|TRN-706]]
- `contains` → [[work-items/TRN-707|TRN-707]]
- `depends-on` ← [[sprints/INT-9|INT-9]]
- `depends-on` ← [[sprints/WSP-8|WSP-8]]
- `depends-on` → [[sprints/CONF-1|CONF-1]]
- `targets-profile` → [[profiles/CCR-CLASSC-C-001|CCR-CLASSC-C-001]]

## Data

```json
{
  "status": "in-progress",
  "goal": "Complete the historical datagram and transaction mechanics required beneath WSP.",
  "dependsOn": [
    "CONF-1"
  ],
  "exitGates": [
    "The nine-row selected WDP path and five-row selected WCMP path have executable evidence.",
    "WTP evidence is required only when connection-oriented WSP is claimed.",
    "Timing tests are deterministic and do not require live networks.",
    "WAP 2.0 transport deltas are explicit."
  ],
  "source": "docs/waves/wap-1.2.1-compliance-program.json"
}
```
