---
id: "sprint:WSP-8"
key: "WSP-8"
type: "sprint"
generated: true
slice: "WSP-8"
status: "in-progress"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/sprint"
---

# WSP session, connectionless, headers, and host fetch

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `contains` → [[work-items/WSP-801|WSP-801]]
- `contains` → [[work-items/WSP-802|WSP-802]]
- `contains` → [[work-items/WSP-803|WSP-803]]
- `contains` → [[work-items/WSP-804|WSP-804]]
- `contains` → [[work-items/WSP-805|WSP-805]]
- `contains` → [[work-items/WSP-806|WSP-806]]
- `depends-on` ← [[sprints/INT-9|INT-9]]
- `depends-on` → [[sprints/CONF-1|CONF-1]]
- `depends-on` → [[sprints/WAE-6|WAE-6]]
- `targets-profile` → [[profiles/CCR-CLASSC-C-001|CCR-CLASSC-C-001]]

## Data

```json
{
  "status": "in-progress",
  "goal": "Complete the WAP 1.2.1 session layer and make it the real desktop ingress path.",
  "dependsOn": [
    "CONF-1",
    "WAE-6"
  ],
  "exitGates": [
    "The eight-row selected connectionless WSP path has executable evidence.",
    "Connection-oriented WSP and WTP remain separately capability-gated.",
    "Desktop GET and POST use the native stack with explicit fallback.",
    "Generated Rust/TypeScript transport contracts have no drift."
  ],
  "source": "docs/waves/wap-1.2.1-compliance-program.json"
}
```
