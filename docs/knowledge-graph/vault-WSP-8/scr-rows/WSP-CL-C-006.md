---
id: "scr-row:WSP-CL-C-006"
key: "WSP-CL-C-006"
type: "scr-row"
generated: true
slice: "WSP-8"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# Method POST -

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wsp|wsp]]
- `planned-by` → [[work-items/WSP-801|WSP-801]]
- `planned-by` → [[work-items/WSP-804|WSP-804]]
- `planned-by` → [[work-items/WSP-805|WSP-805]]
- `refines` ← [[clauses/WSP-CL-CONNECTIONLESS-METHOD-FACILITY|WSP-CL-CONNECTIONLESS-METHOD-FACILITY]]
- `refines` ← [[clauses/WSP-CL-CONNECTIONLESS-TID-REQUIRED|WSP-CL-CONNECTIONLESS-TID-REQUIRED]]
- `refines` ← [[clauses/WSP-CL-METHOD-BODY-CONSTRAINT|WSP-CL-METHOD-BODY-CONSTRAINT]]
- `refines` ← [[clauses/WSP-CL-METHOD-HTTP-SEMANTICS|WSP-CL-METHOD-HTTP-SEMANTICS]]
- `refines` ← [[clauses/WSP-CL-METHOD-INVOKE-PARAMETERS|WSP-CL-METHOD-INVOKE-PARAMETERS]]
- `refines` ← [[clauses/WSP-CL-METHOD-INVOKE-TRANSPARENCY|WSP-CL-METHOD-INVOKE-TRANSPARENCY]]
- `refines` ← [[clauses/WSP-CL-PDU-TYPE-DISPATCH|WSP-CL-PDU-TYPE-DISPATCH]]
- `refines` ← [[clauses/WSP-CL-POST-BODY-TO-SDU-END|WSP-CL-POST-BODY-TO-SDU-END]]
- `refines` ← [[clauses/WSP-CL-POST-CONTENT-TYPE|WSP-CL-POST-CONTENT-TYPE]]
- `refines` ← [[clauses/WSP-CL-POST-PDU-LAYOUT|WSP-CL-POST-PDU-LAYOUT]]
- `refines` ← [[clauses/WSP-CL-POST-PDU-METHOD|WSP-CL-POST-PDU-METHOD]]
- `refines` ← [[clauses/WSP-CL-POST-URI-NO-NUL|WSP-CL-POST-URI-NO-NUL]]
- `refines` ← [[clauses/WSP-CL-PRIMITIVE-ROLE-RESTRICTIONS|WSP-CL-PRIMITIVE-ROLE-RESTRICTIONS]]
- `refines` ← [[clauses/WSP-CL-SELECTED-PDU-ASSIGNMENTS|WSP-CL-SELECTED-PDU-ASSIGNMENTS]]
- `refines` ← [[clauses/WSP-CL-TID-PEER-CORRELATION|WSP-CL-TID-PEER-CORRELATION]]

## Data

```json
{
  "family": "wsp",
  "referencedSection": "6.4.2.1",
  "sourceAnchor": {
    "documentId": "WAP-203_003-WSP",
    "staticConformanceSection": "Appendix D"
  },
  "implementationStatus": "partial",
  "ownerLayers": [
    "transport-rust"
  ],
  "workItems": [
    "WSP-801",
    "WSP-804",
    "WSP-805",
    "T0-27",
    "T0-30"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
