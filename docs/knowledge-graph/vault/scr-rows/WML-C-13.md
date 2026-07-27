---
id: "scr-row:WML-C-13"
key: "WML-C-13"
type: "scr-row"
generated: true
pilot: "WML-2"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/scr-row"
---

# Context restrictions

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `belongs-to` → [[source-families/wml|wml]]
- `planned-by` → [[work-items/WML-201|WML-201]]
- `refines` ← [[clauses/WML-CL-EXTERNAL-NAVIGATION-NEW-CONTEXT|WML-CL-EXTERNAL-NAVIGATION-NEW-CONTEXT]]
- `refines` ← [[clauses/WML-CL-EXTERNAL-NAVIGATION-OLD-CONTEXT|WML-CL-EXTERNAL-NAVIGATION-OLD-CONTEXT]]
- `sourced-from` → [[source-documents/WAP-191_104-WML|WAP-191_104-WML]]

## Data

```json
{
  "family": "wml",
  "ordinal": 13,
  "actor": "wml-user-agent",
  "referencedSection": "10.4",
  "specificationStatus": "mandatory",
  "dependencyExpression": {
    "type": "none",
    "scrIds": []
  },
  "sourceAnchor": {
    "documentId": "WAP-191_104-WML",
    "staticConformanceSection": "15.1.3",
    "changeSection": null
  },
  "disposition": {
    "strict": "required-for-claimed-actor",
    "classCProfile": "required-by-class-c-client-mcf",
    "enhancementMayReplaceStrictBehavior": false
  },
  "reviewState": "source-extracted-class-c-applied-mapping-provisional",
  "implementationStatus": "implemented",
  "evidenceState": "direct-test-linked",
  "assessmentNote": "WML-301 establishes a new observable browser context for independent navigation and elects the permitted old-context termination behavior.",
  "implementationEvidence": [
    {
      "path": "engine-wasm/engine/src/engine_public_api.rs",
      "symbol": "load_deck_context_for_navigation"
    }
  ],
  "testEvidence": [
    {
      "path": "browser/frontend/src/app/navigation-state.load.test.ts",
      "test": "clears prior host history when the engine establishes a new browser context",
      "command": "pnpm --dir browser/frontend test -- src/app/navigation-state.load.test.ts"
    }
  ],
  "ownerLayers": [
    "engine-wasm",
    "browser"
  ],
  "requirementIds": [
    "RQ-RMK-003"
  ],
  "matrixWorkItems": [
    "WML-201"
  ],
  "workItems": [
    "R0-01",
    "R0-03",
    "WML-201"
  ],
  "source": "spec-processing/source-manifests/wap-1.2.1-wml-scr.json"
}
```
