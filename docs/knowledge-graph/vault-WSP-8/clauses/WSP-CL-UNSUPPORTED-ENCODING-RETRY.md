---
id: "clause:WSP-CL-UNSUPPORTED-ENCODING-RETRY"
key: "WSP-CL-UNSUPPORTED-ENCODING-RETRY"
type: "clause"
generated: true
slice: "WSP-8"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# On a peer rejection of unsupported binary encoding, retry with textual encoding compatible with the returned supported-version information.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-014|RQ-TRN-014]]
- `planned-by` → [[work-items/WSP-802|WSP-802]]
- `refines` → [[scr-rows/WSP-CL-C-003|WSP-CL-C-003]]
- `refines` → [[scr-rows/WSP-CL-C-020|WSP-CL-C-020]]
- `sourced-from` → [[source-documents/WAP-203-WSP|WAP-203-WSP]]
- `verified-by` → [[fixtures/WSP-FX-UNSUPPORTED-ENCODING-RETRY|WSP-FX-UNSUPPORTED-ENCODING-RETRY]]

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
    "section": "8.4.2.70",
    "heading": "8.4.2.70 Encoding-Version field",
    "normalizedTextSha256": "0757f5286764c13d549ef75c9b86066462a8225fd14d1f69e44b99e0ac351332"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "On a peer rejection of unsupported binary encoding, retry with textual encoding compatible with the returned supported-version information.",
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
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
