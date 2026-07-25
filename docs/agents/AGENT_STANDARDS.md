# WAP/WML Browser Emulator Agent Standards (v3)

**Project Codename:** Waves  
**Owner:** Dylan Steele  
**Target Platform:** Unix / macOS tooling + Tauri host  
**Rendering Engine:** Rust (native + WebAssembly targets)  
**Transport Layer:** Rust (`transport-rust/`)  
**Adapters / Host UI:** TypeScript (`browser/frontend`)

## Purpose

This document defines operational standards and architectural contracts for contributors and agents working across the Waves WAP emulator stack.

Primary stack layers:

- Rust runtime engine (`engine-wasm/engine`)
- Rust transport library (`transport-rust`)
- TypeScript/Tauri host adapters (`browser`)

## Canonical Layer Responsibilities

- `transport-rust/`
  - network/protocol concerns (HTTP/WAP paths, gateway adaptation)
  - WSP/WBXML handling and payload normalization
  - deterministic transport error taxonomy and request correlation metadata
- `engine-wasm/`
  - WML parsing/runtime semantics
  - navigation/history/focus behavior
  - render list generation
- `browser/`
  - host UI, input wiring, and Tauri command boundaries
  - transport-first fetch flow and handoff to engine contracts

## Hard Isolation Rules

`transport-rust` MUST NOT:

- implement rendering/runtime semantics
- own browser UI/session state

`engine-wasm` MUST NOT:

- perform network requests
- parse WBXML in TS/UI boundaries

`browser` MUST NOT:

- implement WML parser/runtime logic
- bypass transport contract semantics

## Contract-First Files

- `engine-wasm/contracts/wml-engine.ts`
- `browser/contracts/transport.ts`

Behavior changes that cross boundaries must update contracts and docs in the same change.

## Runtime Parity Policy

Engine runtime behavior must stay equivalent across native Rust and WASM targets for:

- deck load and metadata handling
- navigation/focus behavior
- render output
- script invocation side effects

Target-specific glue is allowed only at serialization/binding boundaries.

## Testing Expectations

- Add/adjust unit tests in the layer where behavior changed.
- Add integration/E2E coverage for cross-layer flows (`fetch_deck` -> `loadDeckContext` -> render).
- Preserve deterministic outputs for fixtures and error paths.
- For stable host-visible engine/runtime behavior, check the shared
  `engine-wasm/examples/source` corpus and add or update an adjacent executable `*.flow.json`
  story when the acceptance path is deterministic.
- Validate executable stories by work-item/spec ID with
  `pnpm test:story <work-item-or-spec-id>` (or `all`). Prose `testing-ac` alone remains manual
  evidence and must not be reported as executable coverage.

## Security and Robustness Notes

- Treat host/runtime boundaries as strict IPC contracts.
- Transport errors must remain structured and deterministic.
- Runtime/script failures must trap without crashing host process.

## Duplication Policy

This is the canonical duplication policy, referenced by `docs/agents/RUST_ENGINE_STEERING.md` and
`docs/agents/RUST_TRANSPORT_STEERING.md`. It exists because "keep changes localized, avoid broad
refactors" (see Scope Control in `AGENTS.md`) was being read as license to copy-paste instead of
share, across every layer of this repo. Sharing code is not a broad refactor when it stays inside
the boundary you're already working in; it only becomes one when it would require touching files
you would not otherwise touch for the task at hand. Three tiers, narrowest to widest:

1. **Same file or module.** Before adding a new function, loop, or encode/decode block, grep the
   file (and sibling files in the same directory) for a near-identical existing implementation. If
   one exists, extract a shared helper and have both call sites use it — this is always in scope,
   regardless of how small the requested change is.
2. **Same language, different crate in this workspace** (e.g. `transport-rust` and
   `engine-wasm/engine`, both Rust). If the same logic is genuinely needed in both, do not copy it
   across the crate boundary; pull it into a small shared internal crate instead. This tier has not
   come up yet in practice — the two crates currently have no overlapping logic — but the rule
   exists so the first occurrence doesn't get copy-pasted by default.
3. **Cross-language** (Rust and TypeScript). Single source of truth lives in Rust; the TypeScript
   artifact is generated, never hand-maintained. This is already the house style for wire types
   (`ts-rs`-derived contract types, drift-checked via `pnpm --dir browser run contracts:check`) and
   for runtime behavior (`engine-wasm/engine` compiles once to both native and WASM targets rather
   than reimplementing logic in TypeScript). It is not yet the house style for label/taxonomy
   tables — see `docs/waves/MAINTENANCE_WORK_ITEMS.md` `M1-23` for the tracked gap. Any new
   cross-language constant/label/taxonomy mapping should extend the existing codegen pipeline
   rather than add another hand-copied table.

When duplication is found but fixing it falls outside the current task's touched files (tier 2 or
3, or a tier-1 case in a file you have no other reason to open), record it as a scoped
`docs/waves/MAINTENANCE_WORK_ITEMS.md` entry instead of leaving it undocumented.

## Codegen & Supported-Tooling Policy

This exists because of `M1-18`: `transport-rust/src/native_fetch.rs` hand-rolled its own WSP wire
codec instead of calling into the already-existing, spec-conformant `network::wsp` module —
built one day apart by the same author, never wired together, and the drift sat unnoticed for
months. Two related but distinct failure modes to guard against:

1. **Hand-rolling a format/protocol implementation that already has a supported one.** Before
   writing a new parser, encoder, decoder, or serializer for any wire format, file format, or data
   shape, check whether this repo already has a module/crate for it, or whether the ecosystem has
   a standard crate for it (e.g. `ts-rs` for Rust-to-TypeScript type generation, `wasm_bindgen` for
   the WASM boundary, `network::wsp`'s codec for WSP framing). Use the existing one. If it's
   missing a capability you need, extend it — don't build a second implementation "for now"; "for
   now" is how `M1-18` happened, and it took an explicit owner override to unwind.
2. **Data/logic that must stay in sync across languages or across multiple hand-authored call
   sites should be generated from one source of truth, not hand-copied.** Ask three questions
   before deciding: (a) does this need to exist in more than one place or language, (b) is there
   already a canonical source of truth it could derive from (a Rust struct/enum, a spec, a
   schema), (c) would hand-sync realistically drift given how infrequently this file gets touched
   and by how many different contributors/agents. If yes to those, generate it — through the
   repo's existing generator/derive infrastructure (`ts-rs`, `wasm_bindgen`,
   `browser/scripts/generate-contract-wrappers.mjs`, drift-checked via
   `pnpm --dir browser run contracts:check`) rather than inventing a parallel one-off script. If no
   existing pipeline fits, design the new one deliberately and document it as a contract-first
   surface per `AGENTS.md`, rather than bolting on an ad hoc generator nobody else knows exists.

Shipping a hand-rolled reimplementation of something the repo already has a supported
implementation for is not an acceptable "small, localized change" shortcut, even under Scope
Control — flag the conflict and get an explicit decision (as happened with `M1-18`) rather than
quietly duplicating.

## Agent Behavioral Rules

Agents MUST:

- preserve layer boundaries
- prefer localized, contract-first changes
- keep behavior deterministic and test-backed
- keep completed backlog artifacts immutable; add linked follow-up tickets instead of rewriting `done` tickets when new compliance gaps are found
- commit only from a feature branch; never commit on `main` or `gh-pages`
- create a new branch name when the preferred feature-branch name already exists but is stale, unrelated, or otherwise unsuitable
- dedupe near-identical logic within files/modules already being touched rather than deferring it — see `docs/agents/RUST_ENGINE_STEERING.md` / `docs/agents/RUST_TRANSPORT_STEERING.md` §0 for where in-scope dedup ends and an out-of-scope broad refactor begins

Agents MUST NOT:

- move network behavior into `engine-wasm`
- move WBXML parsing into TypeScript/Tauri frontend code
- introduce broad cross-layer refactors without explicit request
- use branch-name collisions as justification for committing directly on `main`/`gh-pages`

## GitHub Authentication and PR Publishing

Treat these as three independent authentication paths:

1. local Git credentials used by `git fetch` and `git push`
2. local GitHub CLI credentials used by `gh`
3. the Codex GitHub connector installation and its repository permissions

A successful push does not prove that the connector can create a pull request, and a connector
`403 Resource not accessible by integration` does not prove that local `gh` authentication is
invalid.

For local interactive development on macOS:

- Prefer `gh auth login -h github.com -p https -w` so the OAuth credential is stored in the
  system keyring.
- Run `gh auth setup-git` when Git operations should use the same keyring-backed credential.
- Keep `GH_TOKEN` and `GITHUB_TOKEN` unset unless an explicit headless workflow requires one;
  either variable overrides stored `gh` credentials.
- Never place token values in repository files, shell startup files, logs, comments, or agent
  responses.

Before declaring GitHub authentication invalid:

1. Ensure the command has outbound access to `api.github.com`; request the required sandbox or
   network permission when necessary.
2. Run `gh auth status -h github.com`.
3. Confirm API access with `gh api user --jq .login`.
4. Check only whether token environment variables are present; never print their values.

Do not treat a sandboxed network failure as token revocation. If the connector cannot create a
pull request but local `gh` is valid, use `gh` as the fallback.

Before creating a pull request:

1. Resolve the repository, base branch, and current head branch from local Git.
2. Check for an existing pull request for the head branch with
   `gh pr list --repo <owner/repo> --head <branch> --state all`.
3. Create a draft pull request by default unless the user explicitly requests ready-for-review
   status.
4. Use a body file with real Markdown newlines for CLI-created pull requests.
5. Report the resulting pull request URL and whether it is draft or ready for review.

## Backlog Lifecycle Policy

- Do not change the status of an existing `done` ticket to `todo`/`in-progress` during later audits.
- If an implemented ticket is found incomplete or spec-inaccurate, create a new ticket that:
  - references the original `done` ticket in `Depends On` and notes
  - scopes only the corrective delta
  - carries explicit spec references and acceptance checks
- Preserve historical ticket intent and implementation traceability; corrections happen through additive follow-up work items.

## Documentation Source Scope Policy

- For documentation audits and source extraction, default to active documentation paths.
- Exclude `archive/` paths and date-stamped historical snapshots unless explicitly requested by the user.
- If archived docs are requested, treat them as historical evidence only and do not let them override active spec/traceability docs.
