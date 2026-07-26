---
id: "sprint:WML-3"
key: "WML-3"
type: "sprint"
generated: true
slice: "WML-3"
status: "in-progress"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/sprint"
---

# WML state, tasks, events, forms, and navigation

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `contains` → [[work-items/WML-301|WML-301]]
- `contains` → [[work-items/WML-302|WML-302]]
- `contains` → [[work-items/WML-303|WML-303]]
- `contains` → [[work-items/WML-304|WML-304]]
- `contains` → [[work-items/WML-305|WML-305]]
- `contains` → [[work-items/WML-306|WML-306]]
- `contains` → [[work-items/WML-307|WML-307]]
- `contains` → [[work-items/WML-308|WML-308]]
- `depends-on` ← [[sprints/INT-9|INT-9]]
- `depends-on` ← [[sprints/REN-4|REN-4]]
- `depends-on` ← [[sprints/WAE-6|WAE-6]]
- `depends-on` ← [[sprints/WMLS-5|WMLS-5]]
- `depends-on` → [[sprints/WML-2|WML-2]]
- `targets-profile` → [[profiles/CCR-CLASSC-C-001|CCR-CLASSC-C-001]]

## Data

```json
{
  "status": "in-progress",
  "goal": "Close the observable runtime mechanics that define historical WML browser behavior.",
  "dependsOn": [
    "WML-2"
  ],
  "exitGates": [
    "Mandatory WML runtime SCR lines are covered by deterministic tests.",
    "Form/network effects cross contracts without host-side semantic reimplementation.",
    "Native and WASM outcomes are equivalent."
  ],
  "source": "docs/waves/wap-1.2.1-compliance-program.json"
}
```
