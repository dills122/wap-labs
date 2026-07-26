---
id: "clause:WSP-CL-INTEGER-NETWORK-ORDER"
key: "WSP-CL-INTEGER-NETWORK-ORDER"
type: "clause"
generated: true
slice: "WSP-8"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Encode multi-octet integer values in big-endian network octet order.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-010|RQ-TRN-010]]
- `maps-to` → [[requirements/RQ-TRN-014|RQ-TRN-014]]
- `planned-by` → [[work-items/WSP-801|WSP-801]]
- `planned-by` → [[work-items/WSP-802|WSP-802]]
- `refines` → [[scr-rows/WSP-CL-C-001|WSP-CL-C-001]]
- `refines` → [[scr-rows/WSP-CL-C-003|WSP-CL-C-003]]
- `sourced-from` → [[source-documents/WAP-203-WSP|WAP-203-WSP]]
- `verified-by` → [[fixtures/WSP-FX-INTEGER-NETWORK-ORDER|WSP-FX-INTEGER-NETWORK-ORDER]]

## Data

```json
{
  "family": "wsp",
  "parentRows": [
    "WSP-CL-C-001",
    "WSP-CL-C-003"
  ],
  "sourceAnchor": {
    "documentId": "WAP-203-WSP",
    "section": "8.1.1",
    "heading": "8.1.1 Primitive Data Types",
    "normalizedTextSha256": "e3fe5ab3a3402833afe4046e975965594df77b945f837f8fe9974b525b394c97"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Encode multi-octet integer values in big-endian network octet order.",
  "workItems": [
    "T0-09",
    "T0-20",
    "WSP-801",
    "WSP-802"
  ],
  "ownerLayers": [
    "transport-rust"
  ],
  "requirementIds": [
    "RQ-TRN-010",
    "RQ-TRN-014"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
