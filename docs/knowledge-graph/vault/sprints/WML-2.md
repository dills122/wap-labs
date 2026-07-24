---
id: "sprint:WML-2"
key: "WML-2"
type: "sprint"
generated: true
pilot: "WML-2"
status: "todo"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/sprint"
---

# WML parser, deck model, and validation baseline

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `contains` → [[work-items/WML-201|WML-201]]
- `contains` → [[work-items/WML-202|WML-202]]
- `contains` → [[work-items/WML-203|WML-203]]
- `contains` → [[work-items/WML-204|WML-204]]
- `contains` → [[work-items/WML-205|WML-205]]
- `depends-on` ← [[sprints/REN-4|REN-4]]
- `depends-on` ← [[sprints/WML-3|WML-3]]
- `depends-on` → [[sprints/CONF-1|CONF-1]]
- `targets-profile` → [[profiles/CCR-CLASSC-C-001|CCR-CLASSC-C-001]]

## Data

```json
{
  "status": "todo",
  "goal": "Make effective WML 1.3 structure and validation deterministic before closing higher-order runtime behavior.",
  "dependsOn": [
    "CONF-1"
  ],
  "exitGates": [
    "All strict WML structures parse or fail deterministically.",
    "Text and WBXML input parity is fixture-backed.",
    "The 76-item SCR matrix has no unmapped mandatory parser obligation."
  ],
  "source": "docs/waves/wap-1.2.1-compliance-program.json"
}
```
