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

## Security and Robustness Notes

- Treat host/runtime boundaries as strict IPC contracts.
- Transport errors must remain structured and deterministic.
- Runtime/script failures must trap without crashing host process.

## Agent Behavioral Rules

Agents MUST:

- preserve layer boundaries
- prefer localized, contract-first changes
- keep behavior deterministic and test-backed
- keep completed backlog artifacts immutable; add linked follow-up tickets instead of rewriting `done` tickets when new compliance gaps are found
- commit only from a feature branch; never commit on `main` or `gh-pages`
- create a new branch name when the preferred feature-branch name already exists but is stale, unrelated, or otherwise unsuitable

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
