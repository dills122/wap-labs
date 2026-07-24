---
id: "clause:WAE-CL-WML-USER-AGENT-COMPOSITION"
key: "WAE-CL-WML-USER-AGENT-COMPOSITION"
type: "clause"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/clause"
---

# Compose the WML and WMLScript requirements and guidelines into one WML user agent without moving network fetch behavior into the language runtime.

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `maps-to` → [[requirements/RQ-WAE-002|RQ-WAE-002]]
- `maps-to` → [[requirements/RQ-WAE-016|RQ-WAE-016]]
- `maps-to` → [[requirements/RQ-WAE-017|RQ-WAE-017]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` → [[scr-rows/WAESpec-C-017|WAESpec-C-017]]
- `sourced-from` → [[source-documents/WAP-190-WAESpec|WAP-190-WAESpec]]
- `verified-by` → [[fixtures/WAE-FX-WML-USER-AGENT-COMPOSITION|WAE-FX-WML-USER-AGENT-COMPOSITION]]

## Data

```json
{
  "family": "wae",
  "parentRows": [
    "WAESpec-C-017"
  ],
  "sourceAnchor": {
    "documentId": "WAP-190-WAESpec",
    "section": "5.1.7.2",
    "heading": "5.1.7.2 WML User Agent",
    "normalizedTextSha256": "dabe3d5fd9b83131f5bf48122d2f8295edcde15ff9a520364b4ae9393f70c871"
  },
  "normativeForce": "implicit-must",
  "obligationLevel": "required",
  "obligationSynopsis": "Compose the WML and WMLScript requirements and guidelines into one WML user agent without moving network fetch behavior into the language runtime.",
  "workItems": [
    "WAE-601",
    "WML-201",
    "WML-301",
    "WMLS-501"
  ],
  "ownerLayers": [
    "browser",
    "engine-wasm",
    "transport-rust"
  ],
  "requirementIds": [
    "RQ-WAE-002",
    "RQ-WAE-016",
    "RQ-WAE-017"
  ],
  "implementationStatus": "not-assessed",
  "evidenceGate": "A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.",
  "source": "spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
}
```
