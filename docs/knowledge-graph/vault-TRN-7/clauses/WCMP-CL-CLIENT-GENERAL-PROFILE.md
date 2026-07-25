---
id: "clause:WCMP-CL-CLIENT-GENERAL-PROFILE"
key: "WCMP-CL-CLIENT-GENERAL-PROFILE"
type: "clause"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Implement the general WCMP message branch used to report WDP processing errors on the selected non-ICMP profile.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRX-006|RQ-TRX-006]]
- `planned-by` → [[work-items/TRN-703|TRN-703]]
- `planned-by` → [[work-items/TRN-707|TRN-707]]
- `refines` → [[scr-rows/WCMP-C-001|WCMP-C-001]]
- `refines` → [[scr-rows/WCMP-SP-C-002|WCMP-SP-C-002]]
- `sourced-from` → [[source-documents/WAP-202-WCMP|WAP-202-WCMP]]
- `verified-by` → [[fixtures/WCMP-FX-CLIENT-GENERAL-PROFILE|WCMP-FX-CLIENT-GENERAL-PROFILE]]

## Data

```json
{
  "family": "wcmp",
  "parentRows": [
    "WCMP-C-001",
    "WCMP-SP-C-002"
  ],
  "sourceAnchor": {
    "documentId": "WAP-202-WCMP",
    "section": "5.4",
    "heading": "5.4. WCMP in Non-IP Networks",
    "normalizedTextSha256": "889ac83ddb5aa32bddd6c3ba6b90297324af1c044d297a461883ff28565ba022"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Implement the general WCMP message branch used to report WDP processing errors on the selected non-ICMP profile.",
  "workItems": [
    "T0-17",
    "TRN-703",
    "TRN-707"
  ],
  "ownerLayers": [
    "transport-rust"
  ],
  "requirementIds": [
    "RQ-TRX-006"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
