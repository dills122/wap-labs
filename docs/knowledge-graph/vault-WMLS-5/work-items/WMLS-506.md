---
id: "work-item:WMLS-506"
key: "WMLS-506"
type: "work-item"
generated: true
slice: "WMLS-5"
status: "todo"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/work-item"
---

# WMLScript source/compiled content routing

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `contains` ← [[sprints/WMLS-5|WMLS-5]]
- `covers-family` → [[source-families/wbxml|wbxml]]
- `covers-family` → [[source-families/wmlscript|wmlscript]]
- `owned-by` → [[owner-layers/browser|browser]]
- `owned-by` → [[owner-layers/engine-wasm|engine-wasm]]
- `owned-by` → [[owner-layers/qa|qa]]
- `owned-by` → [[owner-layers/transport-rust|transport-rust]]
- `relates-to` → [[legacy-tickets/W1-01|W1-01]]

## Data

```json
{
  "status": "todo",
  "ownerLayers": [
    "transport-rust",
    "browser",
    "engine-wasm",
    "qa"
  ],
  "sourceFamilies": [
    "wmlscript",
    "wbxml"
  ],
  "existingTickets": [
    "W1-01"
  ],
  "outputs": [
    "WMLScript source/compiled content routing"
  ],
  "acceptance": [
    "MIME handling, compiled-script decode, cache identity, fetch ownership, and engine invocation preserve layer boundaries."
  ],
  "evidence": [
    "cargo test --manifest-path transport-rust/Cargo.toml",
    "cargo test --manifest-path browser/src-tauri/Cargo.toml",
    "cargo test --manifest-path engine-wasm/engine/Cargo.toml"
  ],
  "source": "docs/waves/wap-1.2.1-compliance-program.json"
}
```
