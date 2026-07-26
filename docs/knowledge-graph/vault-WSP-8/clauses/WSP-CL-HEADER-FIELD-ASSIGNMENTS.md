---
id: "clause:WSP-CL-HEADER-FIELD-ASSIGNMENTS"
key: "WSP-CL-HEADER-FIELD-ASSIGNMENTS"
type: "clause"
generated: true
slice: "WSP-8"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Implement every default-page header name token and minimum encoding version in effective Table 39 without reusing deprecated assignments.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-014|RQ-TRN-014]]
- `planned-by` → [[work-items/WSP-802|WSP-802]]
- `refines` → [[scr-rows/WSP-CL-C-003|WSP-CL-C-003]]
- `refines` → [[scr-rows/WSP-CL-C-020|WSP-CL-C-020]]
- `sourced-from` → [[source-documents/WAP-203-WSP|WAP-203-WSP]]
- `verified-by` → [[fixtures/WSP-FX-HEADER-FIELD-ASSIGNMENTS|WSP-FX-HEADER-FIELD-ASSIGNMENTS]]

## Data

```json
{
  "family": "wsp",
  "parentRows": [
    "WSP-CL-C-003",
    "WSP-CL-C-020"
  ],
  "sourceAnchor": {
    "documentId": "WAP-203-WSP",
    "section": "appendix-a",
    "heading": "Appendix A Assigned Numbers",
    "normalizedTextSha256": "bdc0ba6d57364f866601489bb42892c1f37500e03a27c9e92844f9495bbf9ee9"
  },
  "normativeForce": "table",
  "obligationLevel": "required",
  "obligationSynopsis": "Implement every default-page header name token and minimum encoding version in effective Table 39 without reusing deprecated assignments.",
  "workItems": [
    "T0-20",
    "WSP-802"
  ],
  "ownerLayers": [
    "transport-rust"
  ],
  "requirementIds": [
    "RQ-TRN-014"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
