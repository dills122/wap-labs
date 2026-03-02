# WaveNav Engine Requirements Matrix (From Local Source-Material Subset)

This matrix maps normative behavior to engine modules and tests.

## Legend

- Priority: `P0` required for MVP, `P1` next phase, `P2` later
- Module: parser/runtime/nav/layout/api

| Req ID | Requirement | Priority | Primary Source | Engine Module | Test Type |
|---|---|---|---|---|---|
| WML-R-001 | Parse `<wml>` with `(head?, template?, card+)` and require at least one card | P0 | `WAP-191_104` DTD (`<!ELEMENT wml ...>`) | parser | unit |
| WML-R-002 | Parse `<card>` with supported MVP children, preserve card order | P0 | `WAP-191_104` DTD (`<!ELEMENT card ...>`) | parser/runtime | unit |
| WML-R-003 | Resolve `#cardId` against current deck ids | P0 | `WAP-191*` card/id semantics | nav/runtime | integration |
| WML-R-004 | Render one active card at a time with deterministic flow order | P0 | `WAP-191*` card presentation model | layout/runtime | snapshot |
| WML-R-005 | Build focus list from interactable anchors (`a`) | P0 | `WAP-191_104` section 9.9 (`a`) | nav/layout | unit |
| WML-R-006 | `Enter` on focused `a[href="#..."]` changes active card | P0 | `WAP-191*` task/nav model | nav/runtime | integration |
| WML-R-007 | `Enter` on focused external href emits host navigation intent | P0 | `WAP-191*` go href semantics | nav/api | integration |
| WML-R-008 | Keep history stack for card/deck transitions | P0 | `WAP-191*` go push + prev semantics | runtime/nav | integration |
| WML-R-009 | Preserve and expose source metadata (`baseUrl`, `contentType`) from load boundary | P0 | architecture boundary + WML media handling | api/runtime | contract |
| WML-R-010 | Parse and retain `card@ordered` and `card@newcontext` attributes | P1 | `WAP-191_104` card attrs | parser/runtime | unit |
| WML-R-011 | Implement `do` parsing with `type/label/name/optional` and contained task | P1 | `WAP-191_104` DTD (`<!ELEMENT do (%task;)>`) | parser/runtime | unit |
| WML-R-012 | Implement task execution for `go`, `prev`, `noop`, `refresh` | P1 | `WAP-191*` section 9.5 | runtime/nav | integration |
| WML-R-013 | Parse `onevent` and bind to intrinsic event types | P1 | `WAP-191_104` section 9.10 + DTD | parser/runtime | unit |
| WML-R-014 | Parse/execute timer model (`timer` element, start/stop/expire rules) | P1 | `WAP-191_104` section 11.7 | runtime | integration |
| WML-R-015 | Variable substitution in text and `%vdata/%HREF` contexts | P1 | `WAP-191_104` variable sections | runtime/parser | unit |
| WML-R-016 | Undefined variable substitution yields empty string | P1 | `WAP-191_104` variable semantics | runtime | unit |
| WML-R-017 | Apply substitution timing after XML parsing | P1 | `WAP-191_104` variable processing order | runtime | integration |
| WML-R-018 | Parse/access `head/template/access/meta` and inherit template nav/event behavior | P2 | `WAP-191_104` DTD + template semantics | parser/runtime | integration |
| WML-R-019 | Support form elements and postfield payload generation | P2 | `WAP-191*` fields/postfield/go | parser/runtime/nav | integration |
| WML-R-020 | Ensure parser ignores unsupported tags gracefully (no panic) | P0 | robustness requirement + broad WML model | parser | unit |
| WML-R-021 | Preserve inline flow across mixed text/link runs within a paragraph (no forced line reset per segment) | P1 | `WAP-191` section 9.9 + 11.8.3 | layout/parser | snapshot |
| WML-R-022 | Implement paragraph wrap/alignment semantics (`mode`, `align`) with card-local default inheritance | P1 | `WAP-191` section 11.8.3 | layout/runtime | integration |
| WML-R-023 | Treat `<br>` as mandatory line break in inline flow and paragraph content | P1 | `WAP-191` section 11.8.4 | parser/layout | integration |
| WML-R-024 | Implement table structure semantics for `table`/`tr`/`td` with `columns` conformance rules (pad/aggregate) | P2 | `WAP-191` section 11.8.5-11.8.8 | parser/layout | integration |
| WML-R-025 | Implement `pre` best-effort semantics (`xml:space="preserve"`, optional wrap suppression) | P2 | `WAP-191` section 11.8.9 | parser/layout | snapshot |
| WML-R-026 | Apply line-break controls for `&nbsp;` and optional soft-hyphen break behavior in wrap mode | P2 | `WAP-191` section 11.8.3 | layout | unit |
| WBXML-R-001 | Keep WBXML decode outside engine MVP; accept textual WML | P0 | `WAP-192*` + architecture decision | api | contract |
| WBXML-R-002 | Preserve optional raw bytes metadata for debug fidelity | P1 | `WAP-192*` token/binary handling context | api | contract |

## Waves Traceability Mapping

This maps engine-local requirement IDs to Waves global traceability IDs.

| Engine Req ID(s) | Waves Requirement IDs |
|---|---|
| `WML-R-001`, `WML-R-002` | `RQ-RMK-001` |
| `WML-R-003`, `WML-R-006`, `WML-R-008` | `RQ-RMK-003`, `RQ-WAE-016`, `RQ-WAE-017` |
| `WML-R-004` | `RQ-RMK-001`, `RQ-RMK-009` |
| `WML-R-005` | `RQ-RMK-006` |
| `WML-R-007` | `RQ-RMK-003`, `RQ-WAE-010` |
| `WML-R-009` | `RQ-RMK-007`, `RQ-WAE-001` |
| `WML-R-010` | `RQ-RMK-003` |
| `WML-R-011`, `WML-R-012` | `RQ-RMK-002` |
| `WML-R-013`, `WML-R-014` | `RQ-RMK-004` |
| `WML-R-015`, `WML-R-016`, `WML-R-017` | `RQ-RMK-005` |
| `WML-R-018` | `RQ-RMK-001`, `RQ-RMK-009` |
| `WML-R-019` | `RQ-RMK-008` |
| `WML-R-020` | `RQ-RMK-009` |
| `WML-R-021`, `WML-R-022`, `WML-R-023` | `RQ-RMK-001`, `RQ-RMK-006`, `RQ-RMK-009` |
| `WML-R-024`, `WML-R-025`, `WML-R-026` | `RQ-RMK-001`, `RQ-RMK-009` |
| `WBXML-R-001`, `WBXML-R-002` | `RQ-RMK-007`, `RQ-WAE-005` |

## Explicit Non-goals (Current Phase)

- In-engine WBXML decoding
- Full WMLScript conformance closure in this matrix (tracked separately under `docs/waves/WMLSCRIPT_SPEC_TRACEABILITY.md` and `docs/waves/WORK_ITEMS.md` Phase W/W1)
- WCSS layout semantics
- Vendor-specific UI quirks outside spec text
