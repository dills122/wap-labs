---
id: "scr-row:WAESpec-C-017"
key: "WAESpec-C-017"
type: "scr-row"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# WML user agent

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wae|wae]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` ← [[clauses/WAE-CL-WML-LANGUAGE-DELEGATE|WAE-CL-WML-LANGUAGE-DELEGATE]]
- `refines` ← [[clauses/WAE-CL-WML-USER-AGENT-COMPOSITION|WAE-CL-WML-USER-AGENT-COMPOSITION]]
- `refines` ← [[clauses/WAE-CL-WMLSCRIPT-LANGUAGE-DELEGATE|WAE-CL-WMLSCRIPT-LANGUAGE-DELEGATE]]

## Data

```json
{
  "family": "wae",
  "referencedSection": "5.1.7.2",
  "sourceAnchor": {
    "documentId": "WAP-190_104-WAE-Spec",
    "staticConformanceSection": "Appendix B 1.1",
    "changeSection": "4.3"
  },
  "implementationStatus": "partial",
  "ownerLayers": [
    "engine-wasm",
    "transport-rust",
    "browser"
  ],
  "workItems": [
    "WAE-601",
    "WML-201",
    "WML-301",
    "WMLS-501"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
