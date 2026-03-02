# WAP-191 (WML 1.3) Full-Stack Compliance Audit

Version: v0.1  
Date: 2026-03-02  
Primary source: `spec-processing/source-material/parsed-markdown/WAP-191-WML-20000219-a.cleaned.md`

## Purpose

Create a project-wide, implementation-facing audit of WAP-191 obligations across:

- transport ingestion/normalization
- engine parser/runtime/layout
- script/runtime integration boundaries
- browser host/session behavior
- encoder/validation tooling expectations

This audit is scoped to WAP-191 only. It does not replace WMLScript, WAE, WSP, WTP, WDP, or security-domain traceability docs.

## Method

1. Sweep all normative chapters in WAP-191 sections 5-15.
2. Cross-check current implementation shape in:
- `transport-rust/`
- `engine-wasm/engine/`
- `engine-wasm/contracts/`
- `browser/contracts/`
- existing boards and traceability docs.
3. Classify each obligation family as:
- `covered`
- `partial`
- `missing`
- `deferred` (optional/profile-gated)

## Full-Stack Obligation Matrix

| Domain | WAP-191 Sections | Project Layer(s) | Status | Existing Coverage | Required Follow-up |
| --- | --- | --- | --- | --- | --- |
| URL semantics and fragment resolution | 5.1-5.3, 9.5.1, 12.5 | engine runtime + browser host | partial | Fragment/basic external intent implemented | Complete process-order rules and request metadata propagation |
| Character set + entity handling | 6.1-6.2, 10.3.3 | transport + parser + runtime | partial | Core entity decoding exists; WBXML decode exists | Add strict substitution/escaping semantics (`$`, `escape/noesc/unesc`) and charset-path fixtures |
| Syntax and variable placement validity | 7.1-7.9, 10.3.5, 15.3/15.4 (`WML-64/65/70`) | parser + validator paths | partial | Basic parse + robustness baseline | Add variable-reference context validation and deterministic error classes |
| Core data-type semantics | 8.x | parser/runtime | partial | Minimal subset implicit only | Add `%length`, `%HREF`, boolean/number validation where behavior depends on them |
| Task model (`go/prev/noop/refresh`) | 9.5, 12.5, 15.1.2 | parser + runtime + browser + transport | partial | Basic fragment/back/external flow | Implement full inter-card task pipeline and failure rollback semantics |
| `postfield`/`setvar` behavior | 9.3-9.4 | parser + runtime + transport | missing | Not implemented end-to-end | Add request-field generation, substitution order, and same-deck suppression rules |
| `do`/`onevent` model and conflict constraints | 9.6-9.10, 15.3/15.4 (`WML-66/67/68/69/71/72/73/74`) | parser + runtime | partial | Limited accept/onenterforward support | Add full element coverage, conflict validation, and deterministic handling |
| Browser context/history fidelity | 9.2, 10.1-10.4, 12.2 | engine runtime + browser session | partial | Index-based back-stack baseline | Expand history entries to spec-shaped request identity and context semantics |
| Deck structure (`head/template/card/access/meta`) | 11.1-11.5 | parser + runtime + browser policy | partial | `card` subset implemented | Parse/retain/access metadata, template inheritance, and deck access-control policy hooks |
| Control/form model (`select/option/optgroup/input/fieldset`) | 11.6, 15.1.5 | parser + runtime + renderer | partial | Early link/text-only subset | Add initialization order, commit rules, mask validation, and variable update timing |
| Timer lifecycle | 11.7, 9.10, 12.5, 15.1.2 | runtime + host timing adapter | partial | Script-side timer hostcall work in progress | Add native WML timer semantics (start/stop/resume/ontimer ordering) |
| Text layout semantics | 11.8.1-11.8.9 | parser + renderer | partial | Baseline wrap/focus implemented | Complete inline flow, paragraph mode/alignment, table semantics, preformatted handling |
| Image semantics | 11.9, 15.1.6 | parser + renderer + host media | missing/partial | Minimal/none in engine renderer | Implement `img` element semantics and capability-gated hints |
| UA semantics (access control, low-memory, errors, unknown DTD) | 12.1-12.4 | browser host + runtime | partial | Unknown-tag robustness exists | Add access control enforcement path, low-memory policy behavior, deterministic unknown-DTD handling |
| WML binary representation and token tables | 14.x, 15.2 | transport/encoder tooling | partial | WBXML decode boundary present | Add encoder/validation tooling path and WBXML token/literal conformance fixtures |
| Static conformance statement execution model | 15.x | all layers + QA tooling | missing (formal) | Fragmented coverage in multiple boards | Add machine-readable conformance matrix + CI gate |

## Major Gaps Not Fully Tracked Before This Audit

1. Full `WML-01..75` conformance closure is not currently represented as a single executable board.
2. Section 12.5 inter-card process ordering (including failure semantics) is only partially ticketed.
3. Server/client conformance constraints in section 15.3/15.4 are not yet mapped to deterministic validation tooling.
4. Table/pre/image semantics in section 11.8/11.9 were under-specified in backlog until this pass.
5. Access-control semantics (`access` element + deck restrictions) are captured as metadata goals but not fully wired to host policy enforcement.

## Conformance Completion Plan (Cross-Board)

Use Phase R tickets in `docs/waves/WORK_ITEMS.md` as the single coordination lane for WAP-191 closure:

- `R0-01` WML-191 conformance matrix + CI gate
- `R0-02` inter-card navigation/process-order completion
- `R0-03` history/context fidelity completion
- `R0-04` parser semantic completeness for structure/task/form elements
- `R0-05` renderer semantics completion (`11.8`/`11.9`)
- `R0-06` transport/request-policy and postfield plumbing
- `R0-07` browser access-control/low-memory/unknown-DTD policy path
- `R0-08` encoder/validation tooling for section `14` + `15.2/15.3/15.4`

Engine-level additive tickets are tracked in `docs/wml-engine/work-items.md` (B5/C5 follow-up queue).

## Exit Criteria for WAP-191 Closure

1. All mandatory WML conformance IDs in section 15 are mapped to deterministic tests or explicit policy assertions.
2. Optional (`O`) IDs are either:
- implemented and tested, or
- explicitly profile-gated/deferred with rationale.
3. Browser + engine + transport contract fields are traceable to WAP-191 requirement IDs without orphan behavior.
4. CI includes a conformance status check that fails on unmapped mandatory IDs.
