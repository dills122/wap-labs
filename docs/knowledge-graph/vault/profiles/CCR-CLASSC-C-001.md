---
id: "profile:CCR-CLASSC-C-001"
key: "CCR-CLASSC-C-001"
type: "profile"
generated: true
pilot: "WML-2"
status: "selected-from-wap-215"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/profile"
---

# WAP-215 Class C data client

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `requires-family` → [[source-families/wae|wae]]
- `requires-family` → [[source-families/wbxml|wbxml]]
- `requires-family` → [[source-families/wml|wml]]
- `selected-from` → [[source-documents/WAP-215-ClassConform-20001213-a|WAP-215-ClassConform-20001213-a]]
- `targets-profile` ← [[sprints/WML-2|WML-2]]

## Data

```json
{
  "status": "selected-from-wap-215",
  "role": "primary-strict-target",
  "summary": "Exact CCR-CLASSC-C-001 data-client profile: WAE, WML, WBXML, WMLScript, WMLScript libraries, caching, WSP, WDP, and WCMP mandatory client features. WTP becomes mandatory only when connection-mode WSP is supported; security, push, telephony, identity, and UAProf remain separately declared.",
  "deviceRole": "client",
  "deviceClass": "C",
  "requirementExpressions": [
    "WAESpec:MCF",
    "WML:MCF",
    "WBXML:MCF",
    "WMLScript:MCF",
    "WMLScriptLibs:MCF",
    "WAPCachingMod:MCF",
    "WSP:MCF",
    "WDP:MCF",
    "WCMP:MCF"
  ],
  "effectiveFamilies": [
    "wae",
    "wml",
    "wbxml",
    "wmlscript",
    "wmlscript-libraries",
    "caching",
    "wsp",
    "wdp",
    "wcmp"
  ],
  "sourceDocumentId": "WAP-215-ClassConform-20001213-a",
  "source": "spec-processing/source-manifests/wap-1.2.1-class-conformance.json"
}
```
