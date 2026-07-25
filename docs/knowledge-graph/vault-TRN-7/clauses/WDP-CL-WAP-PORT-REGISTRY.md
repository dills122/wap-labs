---
id: "clause:WDP-CL-WAP-PORT-REGISTRY"
key: "WDP-CL-WAP-PORT-REGISTRY"
type: "clause"
generated: true
slice: "TRN-7"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Recognize the complete WAP port assignment table, including connectionless, session, secure, push, vCard, and vCalendar services.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-TRN-003|RQ-TRN-003]]
- `planned-by` → [[work-items/TRN-701|TRN-701]]
- `refines` → [[scr-rows/WDP-NA-C-006|WDP-NA-C-006]]
- `refines` → [[scr-rows/WDP-NA-C-007|WDP-NA-C-007]]
- `sourced-from` → [[source-documents/WAP-200-WDP|WAP-200-WDP]]
- `verified-by` → [[fixtures/WDP-FX-WAP-PORT-REGISTRY|WDP-FX-WAP-PORT-REGISTRY]]

## Data

```json
{
  "family": "wdp",
  "parentRows": [
    "WDP-NA-C-006",
    "WDP-NA-C-007"
  ],
  "sourceAnchor": {
    "documentId": "WAP-200-WDP",
    "section": "appendix-b",
    "heading": "Appendix B: Port Number Definitions",
    "normalizedTextSha256": "c7493f6d277782e0e338d05d1d1c451919c7198da4cff6e5217db0374a81be26"
  },
  "normativeForce": "table",
  "obligationLevel": "required",
  "obligationSynopsis": "Recognize the complete WAP port assignment table, including connectionless, session, secure, push, vCard, and vCalendar services.",
  "workItems": [
    "T0-19",
    "TRN-701"
  ],
  "ownerLayers": [
    "transport-rust"
  ],
  "requirementIds": [
    "RQ-TRN-003"
  ],
  "implementationStatus": "implemented",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
