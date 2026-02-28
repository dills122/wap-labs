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
- `transport-python/`: Lowband transport appliance API and WSP/WBXML translation
- `engine-wasm/`: WaveNav WML runtime, parser, layout, and WASM engine contracts
- `electron-app/`: desktop host harness and adapter integration

When a change spans multiple layers, preserve boundaries and update contracts first.

## Contract-first files

Treat these as interface contracts before implementation details:

- `transport-python/api/openapi.yaml`
- `engine-wasm/contracts/wml-engine.ts`
- `electron-app/contracts/transport.ts`

If behavior changes, update the relevant contract and docs in the same change.

## Architecture guardrails

MUST:

- keep WML deck/card semantics deterministic (navigation, focus, card transitions)
- keep WBXML decode/encode in `transport-python/`
- keep rendering and WML runtime logic in `engine-wasm/`
- keep host window/input wiring in `electron-app/`

MUST NOT:

- move rendering logic into Python transport services
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

## Repo conventions

- Follow `.editorconfig` for whitespace and indentation.
- Update docs when interfaces, setup steps, or commands change.
- Add tests for parser/runtime behavior changes when toolchain is available.
- Avoid committing generated artifacts unless explicitly requested.

## Useful commands

- Legacy stack: `make up`, `make down`, `make status`, `make smoke`
- WASM engine build: `cd engine-wasm/engine && wasm-pack build --target web --out-dir ../pkg`
- WASM engine tests: `cd engine-wasm/engine && cargo test`

## Additional Info & Standard

please refer to `docs/agents/AGENT_STANDARDS.md` for a more in depth, language specific reference on standards
