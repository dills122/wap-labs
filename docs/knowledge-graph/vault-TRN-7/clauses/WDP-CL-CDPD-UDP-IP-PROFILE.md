---
id: "clause:WDP-CL-CDPD-UDP-IP-PROFILE"
key: "WDP-CL-CDPD-UDP-IP-PROFILE"
type: "clause"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Declare the selected CDPD bearer as an IP-capable profile whose WDP datagram service is UDP over IPv4.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-002|RQ-TRN-002]]
- `maps-to` → [[requirements/RQ-TRN-003|RQ-TRN-003]]
- `planned-by` → [[work-items/TRN-701|TRN-701]]
- `planned-by` → [[work-items/TRN-706|TRN-706]]
- `planned-by` → [[work-items/TRN-707|TRN-707]]
- `planned-by` → [[work-items/TRN-708|TRN-708]]
- `refines` → [[scr-rows/WDP-CT-C-002|WDP-CT-C-002]]
- `refines` → [[scr-rows/WDP-NA-C-003|WDP-NA-C-003]]
- `sourced-from` → [[source-documents/WAP-200-WDP|WAP-200-WDP]]
- `verified-by` → [[fixtures/WDP-FX-CDPD-UDP-IP-PROFILE|WDP-FX-CDPD-UDP-IP-PROFILE]]

## Data

```json
{
  "family": "wdp",
  "parentRows": [
    "WDP-CT-C-002",
    "WDP-NA-C-003"
  ],
  "sourceAnchor": {
    "documentId": "WAP-200-WDP",
    "section": "5.4.3",
    "heading": "5.4.3 WDP over CDPD",
    "normalizedTextSha256": "6c8a7ed89a46acd6babdf888a40958818e1b26f3536f5989723d6538b9b0a33a"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Declare the selected CDPD bearer as an IP-capable profile whose WDP datagram service is UDP over IPv4.",
  "workItems": [
    "T0-19",
    "TRN-701",
    "TRN-706",
    "TRN-707",
    "TRN-708"
  ],
  "ownerLayers": [
    "transport-rust"
  ],
  "requirementIds": [
    "RQ-TRN-002",
    "RQ-TRN-003"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
