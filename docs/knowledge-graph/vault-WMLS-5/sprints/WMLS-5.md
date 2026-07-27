---
id: "sprint:WMLS-5"
key: "WMLS-5"
type: "sprint"
generated: true
slice: "WMLS-5"
status: "in-progress"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/sprint"
---

# WMLScript language, bytecode, VM, and libraries

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `contains` → [[work-items/WMLS-501|WMLS-501]]
- `contains` → [[work-items/WMLS-502|WMLS-502]]
- `contains` → [[work-items/WMLS-503|WMLS-503]]
- `contains` → [[work-items/WMLS-504|WMLS-504]]
- `contains` → [[work-items/WMLS-505|WMLS-505]]
- `contains` → [[work-items/WMLS-506|WMLS-506]]
- `depends-on` ← [[sprints/INT-9|INT-9]]
- `depends-on` ← [[sprints/WAE-6|WAE-6]]
- `depends-on` → [[sprints/CONF-1|CONF-1]]
- `depends-on` → [[sprints/WML-3|WML-3]]
- `targets-profile` → [[profiles/CCR-CLASSC-C-001|CCR-CLASSC-C-001]]

## Data

```json
{
  "status": "in-progress",
  "goal": "Close the mandatory Class C script engine and standard-library behavior with bounded deterministic execution.",
  "dependsOn": [
    "CONF-1",
    "WML-3"
  ],
  "exitGates": [
    "Mandatory WMLScript and library SCR lines have executable evidence.",
    "Malformed bytecode cannot reach execution.",
    "Native/WASM and host capability outcomes are equivalent."
  ],
  "source": "docs/waves/wap-1.2.1-compliance-program.json"
}
```
