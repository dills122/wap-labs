# AGENTS

Codex steering for this repository.

## Purpose

This repository is a pre-alpha, layered WAP emulator stack. Optimize for:

- protocol fidelity to WAP/WML behavior
- strict layer responsibilities
- small, explicit changes over broad refactors

Breaking compatibility is acceptable at this stage when it helps move the MVP forward.

## Canonical layer map

- `gateway-kannel/` + `docker/kannel/`: gateway behavior and environment wiring
- `transport-rust/`: Lowband in-process transport library and WSP/WBXML translation
- `engine-wasm/`: WaveNav WML runtime, parser, layout, and WASM engine contracts
- `browser/`: Waves Tauri desktop host harness and adapter integration

When a change spans multiple layers, preserve boundaries and update contracts first.

## Contract-first files

Treat these as interface contracts before implementation details:

- `browser/contracts/transport.ts`
- `engine-wasm/contracts/wml-engine.ts`

If behavior changes, update the relevant contract and docs in the same change.

## Multi-target compatibility policy

- Treat `engine-wasm/engine` as a dual-target runtime: native Rust and WASM adapters.
- Keep runtime behavior identical across targets for deck load, navigation, focus, script invocation, and render output.
- Put target-specific glue at the boundary only (serialization/IPC/wasm bindings), not in parser/runtime/layout logic.
- When engine APIs change, update `engine-wasm/contracts/wml-engine.ts` and document parity expectations in the same change.
- Add or update tests that exercise parity-critical behavior (`loadDeckContext`, `handleKey`, `render`, script invocation, trace entries).

## Architecture guardrails

MUST:

- keep WML deck/card semantics deterministic (navigation, focus, card transitions)
- keep WBXML decode/encode in the transport layer (`transport-rust/`)
- keep rendering and WML runtime logic in `engine-wasm/`
- keep host window/input wiring in `browser/`

MUST NOT:

- move rendering logic into transport services
- add network-fetch behavior to the WASM runtime
- parse WBXML in TypeScript/Electron adapter code
- introduce broad cross-layer refactors unless explicitly requested

## MVP authenticity priorities

Prefer work that improves:

- deck/card navigation correctness
- softkey and input model behavior
- deterministic runtime behavior over browser-like modern DOM assumptions
- realistic transport constraints (including constrained payload behavior)

## Scope control

- Keep MVP scope strict unless asked to expand.
- If scope creep is needed, document it clearly as follow-up work.
- Keep changes localized; avoid “while here” rewrites.

## Feature branch + PR metadata

- Cut a feature branch when work is not a trivial one-file typo/docs fix, or when behavior/tests/contracts/docs change in any runtime layer.
- For MVP engine/runtime feature work, assume a feature branch by default.
- When proposing or completing a feature change, provide at least:
  - suggested branch name
  - suggested PR title/message
- Also include a concise commit message recommendation when the change is ready to land.

## Repo conventions

- Follow `.editorconfig` for whitespace and indentation.
- Update docs when interfaces, setup steps, or commands change.
- Add tests for parser/runtime behavior changes when toolchain is available.
- Avoid committing generated artifacts unless explicitly requested.

## Useful commands

- Bootstrap/refresh local deps: `./scripts/init-refresh.sh` (or `make init-refresh`)
- Legacy stack: `make up`, `make down`, `make status`, `make smoke`
- WASM engine build: `cd engine-wasm/engine && wasm-pack build --target web --out-dir ../pkg`
- WASM engine tests: `cd engine-wasm/engine && cargo test`
- Rust transport checks: `make lint-rust-transport` and `make test-rust-transport`

## Additional Info & Standard

please refer to `docs/agents/AGENT_STANDARDS.md` for a more in depth, language specific reference on standards
and `docs/agents/RUST_STEERING.md` for Rust-specific implementation rules.
