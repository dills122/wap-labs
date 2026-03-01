# Python Steering (Lowband Transport)

Purpose: project-specific Python rules for contributors and coding agents working on `transport-python/`.

This file is intentionally prescriptive. Prioritize deterministic behavior and explicit transport contracts over convenience.

## 1. Scope

Applies to:

- `transport-python/**`
- Python-facing transport CI checks and smoke scripts

Does not apply to:

- Rust engine runtime semantics (`engine-wasm/engine`)
- Tauri host runtime logic (`browser/src-tauri`) except contract alignment

## 2. Core Architecture Rules

1. Python transport owns:

- gateway-facing fetch behavior
- content-type normalization
- WBXML decode/encode (current/future)
- transport error taxonomy and retry policy

2. Python transport does not own:

- WML runtime rendering logic
- deck/card runtime navigation semantics
- host UI concerns

3. Contract first:

- `transport-python/api/openapi.yaml` is the source of truth.
- Implementation changes that alter behavior or fields must update OpenAPI and downstream generated types in the same change.

## 3. API Behavior Rules

1. `/fetch` must return deterministic envelope fields:

- `ok`, `status`, `finalUrl`, `contentType`, `timingMs`
- stable `error.code` taxonomy on failures

2. Preserve engine handoff normalization:

- `engineDeckInput.wmlXml`
- `engineDeckInput.baseUrl`
- `engineDeckInput.contentType`

3. Failure mapping must be explicit:

- unsupported media type -> `UNSUPPORTED_CONTENT_TYPE`
- decode failure -> `WBXML_DECODE_FAILED`
- sidecar/network unreachable -> `TRANSPORT_UNAVAILABLE` or `GATEWAY_TIMEOUT`

## 4. Code Style and Quality

1. Linting:

- Use `ruff` as canonical linter/formatter gate.
- Keep lints strict enough to prevent drift but avoid noisy style churn.

2. Typing:

- Use explicit type hints for public functions and model fields.
- Prefer simple, concrete types over implicit `Any`.

3. Exceptions:

- Convert internal exceptions to stable API error envelope values.
- Do not leak raw tracebacks into API responses.

## 5. Testing Rules

1. Required for behavior changes:

- Unit tests for response normalization and error taxonomy mapping.
- Tests for transport retries/timeouts as features are added.

2. Determinism:

- Avoid flaky network dependencies in unit tests.
- Use mocks or local fixtures for upstream HTTP behavior.

3. CI gate:

- `ruff check transport-python`
- `pytest transport-python/tests`

## 6. Security and Operations

1. Do not execute untrusted payload code.

2. Keep default bind local (`127.0.0.1`) unless explicitly configured.

3. Keep sidecar startup predictable for host integration:

- explicit health endpoint
- explicit runtime env overrides

## 7. Command Reference

From repo root:

```bash
python3 -m venv transport-python/.venv
transport-python/.venv/bin/python -m pip install -r transport-python/requirements.txt -r transport-python/requirements-dev.txt
transport-python/.venv/bin/ruff check transport-python
transport-python/.venv/bin/pytest transport-python/tests
make smoke-transport
```
