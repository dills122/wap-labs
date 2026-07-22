# Rust Transport Steering (Lowband)

Purpose: project-specific Rust rules for contributors and coding agents working on the Lowband
transport library and its host contract boundary.

This file is intentionally prescriptive. Transport code processes untrusted network and protocol
input, so protocol fidelity, bounded resource use, deterministic behavior, and explicit failures
take priority over convenience.

## 1. Scope

Applies to:

- `transport-rust/**`
- transport-facing Rust integration under `browser/src-tauri/**`
- Rust-to-TypeScript transport contract generation
- transport-specific CI, fixtures, replay gates, and smoke tests

Does not apply to:

- WML parsing, runtime, layout, focus, or rendering behavior
- browser UI, input, or host-window state
- engine-native/WASM parity except at the normalized transport-to-engine handoff

## 2. Canonical references

Use these sources in order:

1. Repository architecture and layer rules in `AGENTS.md` and
   `docs/agents/AGENT_STANDARDS.md`.
2. Source precedence in `docs/waves/SOURCE_AUTHORITY_POLICY.md`.
3. Transport requirements in `docs/waves/TRANSPORT_SPEC_TRACEABILITY.md` and
   `docs/waves/TRANSPORT_ADJACENT_SPEC_TRACEABILITY.md`.
4. Active profile decisions in `docs/waves/NETWORK_PROFILE_DECISION_RECORD.md` and
   `docs/waves/networking-layer-definition.md`.
5. Official Rust guidance: Rust Reference, Rust API Guidelines, Rust Style Guide, Clippy, Cargo,
   and Rustdoc documentation.

Do not infer protocol behavior from modern HTTP or browser conventions when a WAP/WSP/WTP/WDP
requirement or fixture defines different behavior.

## 3. Layer ownership

Transport owns:

- HTTP/HTTPS fetch behavior and `wap://`/`waps://` adaptation
- WDP, WTP, WSP, WTLS-profile, and gateway transport behavior
- WBXML decode/encode concerns and content-type normalization
- request policy, retries, timeouts, payload limits, and destination validation
- normalized `FetchDeckResponse` and engine handoff payload construction
- transport error taxonomy, request correlation, protocol traces, and timing metadata

Transport must not:

- parse WML into runtime or render structures
- own deck/card navigation, focus, history, or browser session state
- move protocol parsing into TypeScript or Tauri adapter code
- add UI-facing behavior to compensate for malformed transport output
- bypass the contract generation and drift-check workflow

## 4. Contract source of truth

The exported Rust request/response types in `transport-rust/src/lib.rs` are the source of truth for
the host transport contract.

Generated artifacts include:

- `browser/contracts/generated/transport-host.ts`
- `browser/contracts/transport.ts`
- transport methods in `browser/contracts/generated/tauri-host-client.ts`

Rules:

1. Never edit generated contract files directly.
2. Keep `serde` and `ts-rs` names, casing, optionality, and numeric mappings deliberate.
3. Preserve the existing `FetchDeckResponse` success/failure invariants.
4. Treat new fields, error codes, enum values, and serialization changes as contract changes.
5. Regenerate and commit generated artifacts when the Rust contract changes.
6. Run `pnpm --dir browser run contracts:check` before landing contract changes.
7. Update relevant transport docs and host tests in the same change.

## 5. Protocol fidelity and deterministic state

1. Model protocol states and decisions with explicit enums and value types.
2. Keep codecs and parsers free of hidden global mutable state.
3. Keep state transitions, retry counts, timer behavior, duplicate handling, and replay decisions
   deterministic and traceable.
4. Preserve peer/session/transaction identity explicitly; do not infer identity from incidental
   collection order.
5. Unknown, unsupported, truncated, or invalid protocol input must produce a defined result or
   error without desynchronizing subsequent parsing.
6. Profile-dependent behavior must be explicit. Do not silently enable deferred `wap-net-ext`
   features or change the active/rollback posture.
7. Do not silently fall back between `wap-net-core` and `gateway-bridged`; fallback behavior must
   be contract-visible, configured, and test-covered.
8. Protocol behavior changes require fixture or replay evidence tied to the relevant requirement.

## 6. Untrusted input and resource bounds

Treat URLs, headers, response bodies, datagrams, WBXML, decoder output, and fixture bytes as
untrusted.

Rules:

1. Validate lengths before slicing, indexing, allocation, conversion, or state mutation.
2. Use checked or saturating arithmetic where lengths, offsets, counters, and timers can overflow.
3. Bound response bodies, decoded output, URI sizes, redirects, retries, timers, replay windows,
   and protocol collections.
4. Reject oversized or malformed input deterministically; never truncate silently when truncation
   changes protocol meaning.
5. Avoid allocations derived directly from untrusted length fields until limits are validated.
6. Do not panic on network, protocol, WBXML, or user-controlled input.
7. Keep failure paths safe for partial reads, short packets, invalid UTF encodings, and unknown
   assigned numbers.

## 7. Network destination policy

1. Preserve `PublicOnly` as the default fetch destination policy.
2. Validate the original URL, resolved addresses, and every redirect destination.
3. Treat loopback, private, link-local, unspecified, multicast, and IPv4-mapped IPv6 addresses
   consistently.
4. Do not weaken DNS-rebinding or redirect protections for test convenience.
5. Private/local access must require the explicit policy path used by controlled development and
   smoke environments.
6. Keep redirect limits and request timeouts finite.
7. Never log secrets, credentials, session payloads, or unrestricted response bodies.

## 8. Error and response policy

1. Recoverable failures return `Result` internally or a normalized `FetchDeckResponse` at the
   public fetch boundary.
2. Preserve the stable public error codes:
   - `INVALID_REQUEST`
   - `GATEWAY_TIMEOUT`
   - `UNSUPPORTED_CONTENT_TYPE`
   - `WBXML_DECODE_FAILED`
   - `PROTOCOL_ERROR`
   - `PAYLOAD_TOO_LARGE`
   - `TRANSPORT_UNAVAILABLE`
3. Adding or changing an error code requires Rust/TypeScript contract, mapping tests, and transport
   documentation updates.
4. Keep error classification deterministic; do not map the same failure differently by incidental
   call path.
5. Preserve request IDs in structured details and transport events when present.
6. Keep integration-visible error messages stable and concise.
7. Do not expose sensitive internal paths, command arguments, or payload contents in public error
   details.

## 9. Blocking I/O and host integration

The current library intentionally uses blocking HTTP, socket, filesystem, and child-process APIs.
Do not introduce an async runtime or rewrite the transport execution model incidentally.

Rules:

1. Blocking transport work must stay off the Tauri async executor through the established
   `spawn_blocking` host boundary.
2. Keep Tauri command adapters thin: apply host defaults, call transport, and map join failures.
3. Do not duplicate fetch, retry, protocol, or WBXML logic in the host adapter.
4. Any async migration requires an explicit cross-layer design, dependency review, contract-parity
   plan, and performance evidence.

## 10. External WBXML decoder

1. Keep WBXML execution isolated in the transport layer.
2. Resolve and canonicalize the executable before launch.
3. Reject ambiguous relative paths containing path components.
4. Invoke the executable directly with structured arguments; never through a shell.
5. Null or tightly capture standard streams; do not inherit interactive input.
6. Enforce execution timeout and decoded-output limits.
7. Kill and reap timed-out or failed child processes.
8. Use temporary directories/files with automatic cleanup.
9. Treat missing tools, non-zero exits, invalid UTF-8, empty output, and oversized output as
   deterministic decode failures.

## 11. API, dependencies, and unsafe code

1. Keep fields private unless they are intentionally part of the library or generated contract.
2. Prefer `pub(crate)` for internal cross-module access and narrow public exports.
3. Use explicit enums for state machines and closed policy sets.
4. Prefer typed internal errors for new multi-variant APIs; avoid broad incidental error refactors.
5. New network, codec, crypto, async, or process dependencies require narrow justification,
   feature review, and maintenance/security consideration.
6. Keep dependency default features disabled when the required surface is intentionally smaller,
   as with the current `reqwest` configuration.
7. `unsafe` is disallowed by default. Any exception requires explicit design review, minimal scope,
   documented invariants with a `SAFETY` comment, and targeted tests.

## 12. Testing policy

Behavior changes require tests at the narrowest useful layer:

1. Codec/parser unit tests for valid, invalid, truncated, boundary, and round-trip cases.
2. State-machine tests for transitions, timers, retries, aborts, duplicates, and replay windows.
3. Fixture/replay tests for normative protocol behavior and assigned-number mappings.
4. Fetch-mapping tests for content type, payload limits, error codes, request IDs, and engine handoff
   invariants.
5. Contract generation/drift checks for public request or response changes.
6. Host integration tests when Tauri defaults or boundary mapping changes.
7. Kannel smoke tests when real gateway, native transport, WBXML, or cross-layer behavior changes.

Additional rules:

- Default tests must not depend on external network availability.
- Keep live Kannel tests ignored/manual unless their execution environment is explicitly provisioned.
- Tests that mutate process environment must use the shared lock, restore prior values, and run
  serialized where required.
- Keep fixtures deterministic and review fixture changes as behavior changes, not mechanical data
  refreshes.
- Add property-based or fuzz coverage for new byte parsers when it materially improves malformed
  input coverage.

## 13. Required quality gates

For transport Rust changes, run from the repository root:

```bash
make lint-rust-transport
make test-rust-transport
```

These enforce or wrap:

- `cargo fmt --check`
- `cargo clippy --all-targets --all-features -- -D warnings`
- serialized transport tests (`--test-threads=1`)

For coverage-sensitive changes:

```bash
make coverage-rust-transport
```

Current CI thresholds are 85% line coverage and 84% function coverage.

For contract changes:

```bash
pnpm --dir browser run contracts:check
```

For real gateway/native integration changes:

```bash
make smoke-transport-wap
```

## 14. PR checklist

Before merge, verify:

1. Layer ownership remains intact.
2. Untrusted input paths are bounded and panic-free.
3. Protocol behavior has requirement-linked fixture or replay evidence.
4. Error and response invariants remain deterministic.
5. Destination policy and redirect/DNS checks remain default-safe.
6. Contract artifacts were regenerated rather than hand-edited when public types changed.
7. Relevant transport, host, and documentation tests pass.
8. Profile posture and rollback behavior remain explicit.
9. No generated or live-smoke artifacts are committed unintentionally.

## 15. Common anti-patterns

Avoid:

1. Parsing with unchecked indexes or trusting length fields.
2. Using `unwrap`, `expect`, or `panic!` on production input paths.
3. Converting protocol/state errors into ambiguous generic failures too early.
4. Adding rendering, WML runtime, or browser state logic to transport modules.
5. Duplicating transport behavior in Tauri or TypeScript adapters.
6. Editing generated TypeScript contracts directly.
7. Adding implicit protocol-profile fallbacks.
8. Running blocking transport work directly on the Tauri async executor.
9. Spawning WBXML tools through a shell or without time/output bounds.
10. Updating completed backlog tickets instead of creating scoped follow-up work.

## 16. Source references

- Rust Reference: https://doc.rust-lang.org/reference/
- Rust API Guidelines: https://rust-lang.github.io/api-guidelines/
- Rust Style Guide: https://doc.rust-lang.org/style-guide/
- Clippy usage: https://doc.rust-lang.org/stable/clippy/usage.html
- Cargo Book: https://doc.rust-lang.org/cargo/
- Rustdoc Book: https://doc.rust-lang.org/rustdoc/
