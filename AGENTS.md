# AGENTS

Codex steering for this repository.

## Project focus

- Preserve the layered WAP architecture:
  - `gateway-kannel/` + `docker/kannel/` for gateway behavior
  - `transport-python/` for WSP/WBXML transport appliance API
  - `engine-wasm/` for WML runtime/layout behavior
  - `electron-app/` for host UI harness
- Keep contracts stable before changing implementation details:
  - `transport-python/api/openapi.yaml`
  - `engine-wasm/contracts/wml-engine.ts`
  - `electron-app/contracts/transport.ts`

## Implementation constraints

- Do not introduce broad refactors across layers unless explicitly requested.
- Prefer additive, backwards-compatible changes to public contracts.
- Keep MVP scope strict unless asked to expand.
- For WML runtime behavior, prioritize deck/card semantics and deterministic focus.

## Repo conventions

- Follow `.editorconfig` for whitespace and indentation.
- Update docs when interfaces, setup steps, or commands change.
- Add tests for parser/runtime behavior changes when toolchain is available.
- Avoid committing generated artifacts unless explicitly requested.

## Useful commands

- Legacy stack: `make up`, `make down`, `make status`, `make smoke`
- WASM engine build: `cd engine-wasm/engine && wasm-pack build --target web --out-dir ../pkg`
- WASM engine tests: `cd engine-wasm/engine && cargo test`
