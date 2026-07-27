---
id: "work-item:WMLS-503"
key: "WMLS-503"
type: "work-item"
generated: true
slice: "WMLS-5"
status: "todo"
tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/work-item"
---

# Extern, pragma, URL invocation, and access-control closure

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

- `contains` ← [[sprints/WMLS-5|WMLS-5]]
- `covers-family` → [[source-families/wmlscript-libraries|wmlscript-libraries]]
- `covers-family` → [[source-families/wmlscript|wmlscript]]
- `owned-by` → [[owner-layers/engine-wasm|engine-wasm]]
- `owned-by` → [[owner-layers/qa|qa]]
- `planned-by` ← [[clauses/WAE-CL-MEDIA-PUSH-FALLBACK|WAE-CL-MEDIA-PUSH-FALLBACK]]
- `planned-by` ← [[clauses/WAE-CL-MEDIA-TYPE-DISPATCH|WAE-CL-MEDIA-TYPE-DISPATCH]]
- `planned-by` ← [[clauses/WAE-CL-WMLSCRIPTC-MEDIA-TYPE|WAE-CL-WMLSCRIPTC-MEDIA-TYPE]]
- `planned-by` ← [[clauses/WMLSCRIPT-CL-ACCESS-DENIAL-ERROR|WMLSCRIPT-CL-ACCESS-DENIAL-ERROR]]
- `planned-by` ← [[clauses/WMLSCRIPT-CL-ACCESS-DOMAIN-PATH-GATE|WMLSCRIPT-CL-ACCESS-DOMAIN-PATH-GATE]]
- `planned-by` ← [[clauses/WMLSCRIPT-CL-EXTERNAL-KEYWORD-GATE|WMLSCRIPT-CL-EXTERNAL-KEYWORD-GATE]]
- `planned-by` ← [[clauses/WMLSCRIPT-CL-FRAGMENT-DOCUMENT-FORM|WMLSCRIPT-CL-FRAGMENT-DOCUMENT-FORM]]
- `planned-by` ← [[clauses/WMLSCRIPT-CL-FRAGMENT-FUNCTION-IDENTITY|WMLSCRIPT-CL-FRAGMENT-FUNCTION-IDENTITY]]
- `planned-by` ← [[clauses/WMLSCRIPT-CL-FUNCTION-NAME-TABLE|WMLSCRIPT-CL-FUNCTION-NAME-TABLE]]
- `planned-by` ← [[clauses/WMLSCRIPT-CL-PRAGMA-ACCESS-UNIQUENESS|WMLSCRIPT-CL-PRAGMA-ACCESS-UNIQUENESS]]
- `planned-by` ← [[clauses/WMLSCRIPT-CL-RELATIVE-URL-RESOLUTION|WMLSCRIPT-CL-RELATIVE-URL-RESOLUTION]]
- `planned-by` ← [[clauses/WMLSCRIPT-CL-URL-CALL-ACCESS-FIRST|WMLSCRIPT-CL-URL-CALL-ACCESS-FIRST]]
- `planned-by` ← [[clauses/WMLSCRIPT-CL-URL-CALL-EXTERNAL-MATCH|WMLSCRIPT-CL-URL-CALL-EXTERNAL-MATCH]]
- `planned-by` ← [[clauses/WMLSCRIPT-CL-URL-CALL-GRAMMAR|WMLSCRIPT-CL-URL-CALL-GRAMMAR]]
- `planned-by` ← [[clauses/WMLSCRIPT-CL-URL-CALL-INVALID-PARAMETERS|WMLSCRIPT-CL-URL-CALL-INVALID-PARAMETERS]]
- `planned-by` ← [[clauses/WMLSCRIPT-CL-URL-CALL-LITERAL-ONLY|WMLSCRIPT-CL-URL-CALL-LITERAL-ONLY]]
- `planned-by` ← [[clauses/WMLSCRIPT-CL-URL-CALL-TYPED-ARGUMENTS|WMLSCRIPT-CL-URL-CALL-TYPED-ARGUMENTS]]
- `planned-by` ← [[clauses/WMLSCRIPT-CL-URL-CALL-UNESCAPE-BEFORE-PARSE|WMLSCRIPT-CL-URL-CALL-UNESCAPE-BEFORE-PARSE]]
- `planned-by` ← [[clauses/WMLSCRIPT-CL-URL-NAMED-COMPILATION-UNITS|WMLSCRIPT-CL-URL-NAMED-COMPILATION-UNITS]]
- `planned-by` ← [[clauses/WMLSCRIPT-CL-URL-SCHEME-SUPPORT|WMLSCRIPT-CL-URL-SCHEME-SUPPORT]]
- `planned-by` ← [[scr-rows/WAESpec-C-021|WAESpec-C-021]]
- `planned-by` ← [[scr-rows/WMLS-C-078|WMLS-C-078]]
- `planned-by` ← [[scr-rows/WMLS-C-079|WMLS-C-079]]
- `planned-by` ← [[scr-rows/WMLS-C-080|WMLS-C-080]]
- `planned-by` ← [[scr-rows/WMLS-C-081|WMLS-C-081]]
- `planned-by` ← [[scr-rows/WMLS-C-082|WMLS-C-082]]
- `planned-by` ← [[scr-rows/WMLS-C-087|WMLS-C-087]]
- `relates-to` → [[legacy-tickets/W0-08|W0-08]]
- `relates-to` → [[legacy-tickets/W1-03|W1-03]]

## Data

```json
{
  "status": "todo",
  "ownerLayers": [
    "engine-wasm",
    "qa"
  ],
  "sourceFamilies": [
    "wmlscript",
    "wmlscript-libraries"
  ],
  "existingTickets": [
    "W1-03",
    "W0-08"
  ],
  "outputs": [
    "Extern, pragma, URL invocation, and access-control closure"
  ],
  "acceptance": [
    "Script loading and invocation respect content identity, access domains/paths, pragmas, argument binding, and deterministic failure."
  ],
  "evidence": [
    "cargo test --manifest-path engine-wasm/engine/Cargo.toml"
  ],
  "source": "docs/waves/wap-1.2.1-compliance-program.json"
}
```
