---
id: "clause:WCMP-CL-IP-NETWORKS-USE-ICMP"
key: "WCMP-CL-IP-NETWORKS-USE-ICMP"
type: "clause"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Use ICMP to provide WCMP error-reporting and diagnostic functions whenever the selected bearer network is IP based.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRX-006|RQ-TRX-006]]
- `maps-to` → [[requirements/RQ-TRX-007|RQ-TRX-007]]
- `maps-to` → [[requirements/RQ-TRX-008|RQ-TRX-008]]
- `planned-by` → [[work-items/TRN-707|TRN-707]]
- `planned-by` → [[work-items/TRN-708|TRN-708]]
- `refines` → [[scr-rows/WCMP-C-001|WCMP-C-001]]
- `refines` → [[scr-rows/WCMP-SP-C-001|WCMP-SP-C-001]]
- `sourced-from` → [[source-documents/WAP-202-WCMP|WAP-202-WCMP]]
- `verified-by` → [[fixtures/WCMP-FX-IP-NETWORKS-USE-ICMP|WCMP-FX-IP-NETWORKS-USE-ICMP]]

## Data

```json
{
  "family": "wcmp",
  "parentRows": [
    "WCMP-C-001",
    "WCMP-SP-C-001"
  ],
  "sourceAnchor": {
    "documentId": "WAP-202-WCMP",
    "section": "5.3",
    "heading": "5.3. WCMP in IP Networks",
    "normalizedTextSha256": "42a64bef140a026d0a08f7ebd61d816a21ea00ec016e66004f7085b46baafa1a"
  },
  "normativeForce": "explicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Use ICMP to provide WCMP error-reporting and diagnostic functions whenever the selected bearer network is IP based.",
  "workItems": [
    "TRN-707",
    "TRN-708"
  ],
  "ownerLayers": [
    "transport-rust"
  ],
  "requirementIds": [
    "RQ-TRX-006",
    "RQ-TRX-007",
    "RQ-TRX-008"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
