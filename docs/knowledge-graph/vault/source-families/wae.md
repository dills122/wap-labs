---
id: "source-family:wae"
key: "wae"
type: "source-family"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/source-family"
---

# Wireless Application Environment

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` ← [[scr-rows/WAESpec-C-015|WAESpec-C-015]]
- `belongs-to` ← [[scr-rows/WAESpec-C-016|WAESpec-C-016]]
- `belongs-to` ← [[scr-rows/WAESpec-C-017|WAESpec-C-017]]
- `effective-document` → [[source-documents/WAP-190_101-WAESpec|WAP-190_101-WAESpec]]
- `effective-document` → [[source-documents/WAP-190_102-WAESpec|WAP-190_102-WAESpec]]
- `effective-document` → [[source-documents/WAP-190_103-WAESpec|WAP-190_103-WAESpec]]
- `effective-document` → [[source-documents/WAP-190_104-WAE-Spec|WAP-190_104-WAE-Spec]]
- `effective-document` → [[source-documents/WAP-190-WAESpec|WAP-190-WAESpec]]
- `requires-family` ← [[profiles/CCR-CLASSC-C-001|CCR-CLASSC-C-001]]

## Data

```json
{
  "sourceClass": "core-mandatory",
  "targetDisposition": "strict-baseline",
  "ownerLayers": [
    "engine-wasm",
    "browser"
  ],
  "completeness": "release-member-chain-complete",
  "effectiveSequence": [
    "WAP-190-WAESpec",
    "WAP-190_101-WAESpec",
    "WAP-190_102-WAESpec",
    "WAP-190_103-WAESpec",
    "WAP-190_104-WAE-Spec"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-effective-spec.json"
}
```
