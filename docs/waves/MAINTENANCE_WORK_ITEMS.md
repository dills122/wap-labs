# Waves Maintenance Work Items

Purpose: track maintenance, quality, and technical-debt work that should be folded into normal delivery.

Status keys:

- `todo`
- `in-progress`
- `blocked`
- `done`

## How To Use

1. Keep items scoped and testable.
2. Link each item to concrete files and acceptance checks.
3. Prefer pairing one maintenance item with each feature/contract ticket when feasible.

## Current Queue

Completed maintenance tickets are archived in:

- `docs/waves/MAINTENANCE_WORK_ITEMS_ARCHIVE.md`

### M1-00 Architecture hardening sprint (next in line)

1. `Status`: `in-progress`
2. `Scope`:
- `browser/`
- `engine-wasm/`
- `transport-rust/`
3. `Build`:
- Execute remaining `M1-*` items as the active maintenance sprint before new feature expansion.
4. `Accept`:
- Sprint checklist and status are reflected in:
- `docs/waves/WORK_ITEMS.md`
- `browser/README.md`
- `engine-wasm/README.md`
- `transport-rust/README.md`
5. `Notes`:
- Active execution is currently anchored to `docs/waves/SPRINT_PLAN_2026-03_MASTER_PRIORITIZED.md`.
- `M1-14`, `M1-15`, and the first `M1-16`/browser responsiveness slices landed in `#109` and `#110`.
- The `M1-08` boundary-module split is complete. Record any newly discovered
  hotspot as an additive ticket instead of reopening the closed item.

### M1-14 Browser host boundary hardening (CSP + DOM injection sinks)

1. `Status`: `done`
2. `Priority`: `P0`
3. `Files`:
- `browser/src-tauri/tauri.conf.json`
- `browser/frontend/src/app/browser-shell-template.ts`
- `browser/frontend/src/app/defaults.ts`
- `browser/frontend/src/main.ts`
4. `Build`:
- Replace permissive renderer hardening posture (`csp: null`) with explicit CSP suitable for the Tauri-hosted app shell.
- Remove/contain HTML string interpolation paths for boot URL rendering (`innerHTML` bootstrap template path).
- Keep startup URL normalization deterministic and safe for attribute/DOM insertion.
5. `Tests`:
- `pnpm --dir browser/frontend test`
- `pnpm --dir browser/frontend build`
- `cd browser/src-tauri && cargo test`
6. `Accept`:
- Renderer does not rely on disabled CSP.
- Boot URL flow does not allow unescaped HTML insertion surfaces in shell bootstrap.
- Existing browser shell behavior remains intact in local and network modes.
7. `Notes`:
- Security audit follow-up for high-severity host boundary risk.
- Landed explicit production and development CSP policies in Tauri config (`csp` + `devCsp`) instead of permissive/null posture.
- Boot URL assignment path is contained to post-mount input property assignment (no runtime URL interpolation into shell HTML template strings).

### M1-15 Engine parser recursion guardrails (untrusted deck DoS hardening)

1. `Status`: `done`
2. `Priority`: `P0`
3. `Files`:
- `engine-wasm/engine/src/parser/wml_parser/actions.rs`
- `engine-wasm/engine/src/parser/wml_parser/nodes.rs`
- `engine-wasm/engine/src/parser/wml_parser/mod.rs`
- `engine-wasm/engine/src/engine_tests.rs`
4. `Build`:
- Add bounded recursion/depth and node-count guardrails in parser tree walks for card/action/node traversal.
- Ensure maliciously deep nested markup fails deterministically with recoverable parse errors (no runtime crash/stack overflow).
5. `Tests`:
- `cd engine-wasm/engine && cargo test`
- Add regression fixtures/tests for deeply nested WML payload rejection behavior.
6. `Accept`:
- Engine rejects pathological nesting with deterministic error surface.
- No process crash or panic path from crafted deep deck structures.
7. `Notes`:
- Security audit follow-up for high-severity parser crash/DoS risk.
- Parser traversal now enforces explicit nesting-depth and visited-node budgets with deterministic
  error surfaces (`Parse limit exceeded: ...`) across action, card-node, inline-node, and text-extraction walks.
- Added parser-level and engine-level regression tests for depth and node-budget exhaustion paths.

### M1-16 Transport/engine payload size guardrails (memory pressure hardening)

1. `Status`: `done`
2. `Priority`: `P1`
3. `Files`:
- `transport-rust/src/lib.rs`
- `transport-rust/src/responses.rs`
- `engine-wasm/engine/src/engine_public_api.rs`
- `browser/contracts/transport.ts`
4. `Build`:
- Enforce explicit response-body/deck-size limits before decode/parse.
- Keep error mapping deterministic when payload limits are exceeded.
- Avoid unnecessary memory amplification for oversized payload paths.
5. `Tests`:
- `make test-rust-transport`
- `cd engine-wasm/engine && cargo test`
- Add fixture coverage for over-limit payload rejection.
6. `Accept`:
- Oversized responses/decks are rejected with stable transport/engine error surfaces.
- Normal-size WML/WBXML paths remain unchanged.
7. `Notes`:
- Security audit follow-up for medium-severity resource exhaustion risk.
- Landed transport-side explicit `PAYLOAD_TOO_LARGE` classification and host contract regeneration in `#109`.
- Added host/engine oversized deck boundary coverage in Tauri and WASM tests in `#109`.
- Current baseline rejects oversized payloads deterministically before decode/parse escalation in the active transport/engine/browser handoff path.

### M1-17 Network fetch destination policy guardrails (SSRF/probing reduction)

1. `Status`: `done`
2. `Priority`: `P1`
3. `Files`:
- `transport-rust/src/lib.rs`
- `browser/src-tauri/src/lib.rs`
- `browser/contracts/transport.ts`
- `docs/waves/TECHNICAL_ARCHITECTURE.md`
4. `Build`:
- Define explicit destination policy for `fetch_deck` host command (default-safe behavior + documented override for developer workflows).
- Keep policy consistent with WAP/WML navigation expectations and existing transport contract boundaries.
5. `Tests`:
- `make test-rust-transport`
- `cd browser/src-tauri && cargo test`
- Add policy-path tests for blocked/allowed destination classes.
6. `Accept`:
- Host fetch path has documented/tested destination constraints appropriate for desktop host threat model.
- External-intent navigation remains deterministic under policy decisions.
7. `Notes`:
- Security audit follow-up for medium-severity SSRF/internal probing exposure if renderer compromise occurs.

### M1-18 `network::wsp` codec is dead code relative to the live native fetch path (2026-07-23)

1. `Status`: `done`
2. `Priority`: `P2`
3. `Files`:
- `transport-rust/src/network/wsp/pdu.rs`
- `transport-rust/src/network/wsp/header_block.rs`
- `transport-rust/src/network/wsp/header_registry.rs`
- `transport-rust/src/network/wsp/encoding_version.rs`
- `transport-rust/src/network/wsp/session.rs`
- `transport-rust/src/network/wsp/decoder.rs`
- `transport-rust/src/network/wsp/encoder.rs`
- `transport-rust/src/wsp_registry.rs`
- `transport-rust/src/wsp_capability.rs`
- `transport-rust/src/native_fetch.rs`
- `docs/waves/NETWORK_PROFILE_DECISION_RECORD.md`
- `docs/waves/TRANSPORT_RUST_PHASE_PLAN.md`
- `docs/waves/WORK_ITEMS.md` (`T0-20`, `T0-27`)
4. `Finding`:
- `transport-rust/src/network/wsp/*` (~2,700 lines across `pdu.rs`, `header_block.rs`, `header_registry.rs`, `encoding_version.rs`, `session.rs`, `decoder.rs`, `encoder.rs`) is a well-structured, bounds-checked, fixture-tested WSP/PDU codec. It is **dead code on the live fetch path**: `grep` confirms nothing outside its own `#[cfg(test)]` modules calls into it except `wsp_registry.rs` (thin re-export wrapper) and `wsp_capability.rs` (consumed by `network::wsp::session`/`pdu`, not the reverse) — and neither `wsp_registry::*` nor `wsp_capability::*` has any caller outside their own test modules either. The chain is self-contained and never reaches production code.
- The actual production native-transport fetch path (`transport-rust/src/native_fetch.rs`, `encode_connectionless_request` / `decode_connectionless_wsp_reply` / `decode_content_type_value` / `decode_text_string` / `decode_uintvar` / `encode_uintvar`, roughly lines 335-600) hand-rolls its own minimal uintvar/content-type/header/PDU parsing from scratch and does not import `crate::network::wsp` at all.
5. `Why the split exists` (evidence, not guesswork):
- `network::wsp::*` landed 2026-03-06 in `#77` (`feat(wsp): add header registry and code-page policy baseline`, closing ticket `T0-20`) and `#78` (`test(transport): add get reply interop replay baseline`).
- `native_fetch.rs` landed the very next day, 2026-03-07, in `#89` ("Native WSP Fetch", closing ticket `T0-27`, "Native connectionless WSP GET fetch path").
- `T0-27`'s own written plan in `docs/waves/WORK_ITEMS.md` explicitly directs: *"Reuse existing WDP adapter and WSP codec/session modules rather than introducing browser-side protocol logic"*, and lists the new file's intended path as `transport-rust/src/network/native_fetch.rs` (nested under `network/`, alongside `wdp/` and `wsp/`).
- What actually shipped is `transport-rust/src/native_fetch.rs` (top level, **not** nested under `network/`). It does reuse `crate::network::wdp` as directed, but it never imports `crate::network::wsp` and instead reimplements the WSP wire codec from scratch. `T0-27` was nonetheless marked `done`.
- No commit message, PR description, or doc found anywhere in `docs/waves/` explains or acknowledges this divergence from the ticket's own stated plan. This reads as **unplanned implementation drift** (the WSP codec module and the fetch executor were built one day apart by the same author but never actually wired together), not a deliberate "reference implementation for later" design — there is no ADR-style note asserting that as intent. Say so plainly rather than inventing a rationale.
- Compounding the confusion: `docs/waves/NETWORK_PROFILE_DECISION_RECORD.md` names `wap-net-core` (which the doc defines as the `network::wsp`-based in-process `WDP -> WTP -> WSP` stack) the "active implementation target profile" and lists `wsp_registry.rs`/`wsp_capability.rs` as its fixture lane; `docs/waves/TRANSPORT_RUST_PHASE_PLAN.md` labels `wap-net-core` "(current)". Both are accurate about profile *intent* but easy to misread as "this is what runs" — the byte-level codec actually executing on the native fetch path today is the hand-rolled one in `native_fetch.rs`, not `network::wsp`.
6. `Decision` (repo owner, 2026-07-23):
- Do not delete `network::wsp::*` — it is wanted for future use and is the spec-conformant target implementation.
- Do not wire it into `native_fetch.rs` in the near term — too large a change to fold into an unrelated pass; treat as a dedicated follow-up.
- A short doc comment now sits above `native_fetch.rs`'s hand-rolled encode/decode section pointing back at this entry so the split isn't a landmine for the next person who finds two WSP parsers and doesn't know which one is real.
7. `Recommendation`:
- Open a dedicated follow-up ticket ("wire `network::wsp` into `native_fetch.rs`") to replace the hand-rolled `encode_connectionless_request`/`decode_connectionless_wsp_reply`/`decode_content_type_value`/`decode_text_string`/`decode_uintvar` functions with calls into `network::wsp::{encoder,decoder,pdu,header_block}`, preserving the existing `FetchDeckResponse` mapping and `TRANSPORT_PROFILE_WAP_NET_CORE` gating behavior. This should close the gap between the documented `wap-net-core` profile and what the profile actually executes.
- Until that lands, treat `network::wsp::*` test coverage as spec-conformance regression coverage only, not evidence about the live fetch path's correctness.
8. `Accept` (for the follow-up ticket, not this entry):
- `native_fetch.rs`'s WSP wire encode/decode calls into `network::wsp` instead of duplicating parsing logic.
- `cargo test` stays green for `transport-rust`; native fetch behavior is unchanged for existing passing fixtures/smokes.
- `docs/waves/NETWORK_PROFILE_DECISION_RECORD.md` / `TRANSPORT_RUST_PHASE_PLAN.md` updated to reflect that `wap-net-core` is genuinely live end-to-end, not just profile-gated.
9. `Resolution` (2026-07-24): **Implemented in this pass, overriding the 2026-07-23 `Decision` to defer, per explicit repo-owner instruction.** The `Decision` and `Why the split exists` sections above are preserved as the historical record of why the split existed and why deferral was originally chosen; they are no longer the active call.
- Added `transport-rust/src/network/wsp/connectionless.rs`, which owns the connectionless (session-less, WDP/UDP) WSP framing: `encode_connectionless_request`, `decode_connectionless_reply`, `encode_uintvar`/`decode_uintvar`, `decode_content_type_value`, `decode_text_string`, `decode_wsp_status_code`, plus typed `WspConnectionlessEncodeError`/`WspConnectionlessDecodeError` enums. It reuses `network::wsp::header_registry` assigned numbers (`encode_pdu_type`/`decode_pdu_type` for the `Get`/`Post`/`Reply` octets, `encode_header_field_name_on_page` for well-known header names) and the `network::wsp::header_block` types (`WspHeaderBlock`/`WspHeaderField`/`WspHeaderNameEncoding`) as its header representation. `network::wsp` is therefore on the live fetch path, no longer test-only.
- Deleted the hand-rolled codec from `native_fetch.rs` (`encode_connectionless_request`, `encode_connectionless_request_headers`, `encode_connectionless_content_type`, `decode_connectionless_wsp_reply`, `encode_uintvar`, `decode_uintvar`, `decode_content_type_value`, `decode_text_string`, `decode_wsp_status_code`, `decode_well_known_media`, and the local `NativeReply` struct) along with the `NOTE(wsp-codec-duplication)` comment block that pointed at this entry. `native_fetch.rs` now owns no wire-format code: it keeps only fetch-level mapping (`encode_native_wap_request`, `negotiated_accept_media`, `connectionless_request_headers`, `build_kannel_request_uri`).
- Scope note: `network::wsp::pdu`/`session` could **not** be called directly without changing bytes on the wire. Their fixture-defined framing is the connection-oriented form (no transaction id, single-octet block lengths, `u16` reply status, text-string header values), while the gateway path speaks the connectionless form (transaction id prefix, `uintvar` block lengths, single-octet assigned-number reply status, short-integer well-known values). Sharing happens at the assigned-number/header-model layer instead; `pdu.rs`/`session.rs` remain the connection-oriented reference implementation.
- Fixed a latent encoder bug carried over from the deleted code: `encode_uintvar` set the continuation bit on the final octet for values >= 128, so any request URI or POST header section of 128+ bytes emitted a length field a conformant peer would mis-parse. The shared implementation sets the continuation bit only on non-final octets; covered by `uintvar_roundtrips_multi_octet_values_with_canonical_continuation_bits`.
- Tests: codec-level cases moved into `connectionless.rs` (`get_request_uses_transaction_id_pdu_type_and_uintvar_uri_length`, `post_request_encodes_content_type_header_block_and_body`, `post_content_type_rejects_nul_bytes`, `decode_content_type_value_*`, `reply_*`, `status_code_mapping_covers_each_assigned_class`); `native_fetch.rs` keeps the fetch-level wire assertions and gains `encode_native_wap_request_rejects_unsupported_methods` and `connectionless_request_headers_negotiate_a_single_accept_media_type`. `make lint-rust-transport` and `make test-rust-transport` pass.
- Not done here: `docs/waves/NETWORK_PROFILE_DECISION_RECORD.md` and `docs/waves/TRANSPORT_RUST_PHASE_PLAN.md` were left unchanged; the `wap-net-core` profile documentation refresh remains open.

### M1-19 `fetch_policy.rs` pre-flight destination check is shallow relative to the enforced check (2026-07-24)

1. `Status`: `done`
2. `Priority`: `P3`
3. `Files`:
- `transport-rust/src/fetch_policy.rs` (`classify_destination_host`, `validate_fetch_destination`)
- `transport-rust/src/fetch_runtime/execution.rs` (`PolicyDnsResolver`)
- `transport-rust/src/native_fetch.rs` (`resolve_fetch_destination_addresses`)
4. `Finding`:
- `classify_destination_host` treats every non-`localhost`/`*.localhost` hostname as `Public` — a fast pre-flight check only. The authoritative SSRF guard is the DNS-resolution-time check (`PolicyDnsResolver` in `execution.rs`, and `resolve_fetch_destination_addresses` for the native path), confirmed present, correctly ordered, and tested. Not a live hole today, but nothing stops a future refactor from trusting the shallow pre-flight check in isolation and quietly dropping the resolution-time enforcement.
5. `Recommendation`:
- Add a regression test (or an inline invariant comment referencing the resolution-time check) that fails loudly if `validate_fetch_destination` is ever called as the sole gate without the resolver-level check also running.
6. `Accept`:
- A future refactor that removes the resolution-time check without also updating the pre-flight check fails a test, rather than silently reopening the class of bug.
7. `Resolution`:
- Added `transport_resolution_time_check_blocks_private_answer_that_shallow_preflight_alone_would_allow` in `transport-rust/src/tests/fetch_mapping.rs`, which asserts the shallow pre-flight (`classify_destination_host`/`validate_fetch_destination`) passes a non-localhost domain, then asserts `validate_resolved_destination_addresses` (the shared function backing both `PolicyDnsResolver` and the native path) independently rejects a simulated private DNS answer for that same host. Combined with the pre-existing `http_client_rejects_private_dns_answer` (execution.rs) and `resolve_destination_socket_addr_rejects_private_peer_under_public_only` (native_fetch.rs) wiring tests, a removal of either resolution-time call site now fails a test. No enforcement logic changed.

### M1-20 Gateway-bridged fetch profile force-sets `AllowPrivate` with no invariant test

1. `Status`: `done`
2. `Priority`: `P3`
3. `Files`:
- `transport-rust/src/fetch_runtime/execution.rs` (`destination_policy` override for `wap://`/`waps://` traffic)
- `transport-rust/src/gateway.rs` (`GATEWAY_HTTP_BASE`)
4. `Finding`:
- For the default `gateway-bridged` profile, `destination_policy` is force-set to `AllowPrivate` because the upstream target is the operator-configured `GATEWAY_HTTP_BASE`, not the original WAP URL. This is intentional and appears safe (the gateway base is env-configured, not attacker-influenced) but rests entirely on `GATEWAY_HTTP_BASE` never becoming attacker-settable — there's no test pinning that invariant.
5. `Recommendation`:
- Add a test asserting `GATEWAY_HTTP_BASE` is read only from process environment/config, never from request-supplied data, so a future change can't silently make it attacker-influenced without breaking a test.
6. `Accept`:
- A regression test exists that would fail if `GATEWAY_HTTP_BASE` (or its equivalent) became derivable from untrusted input.
7. `Resolution`:
- Added `transport_build_gateway_request_ignores_request_supplied_gateway_base_overrides` in `transport-rust/src/tests/request_gateway_policy.rs`. It calls `build_gateway_request` with headers and URL path/query attempting to smuggle an alternate base (`GATEWAY_HTTP_BASE`/`X-Gateway-Http-Base`/`X-Forwarded-Host`/`Host` headers, matching query key) and asserts the resolved gateway URL is unaffected — first against the default base, then against an operator-configured `GATEWAY_HTTP_BASE` env value, confirming the env value always wins over any request-supplied data. No enforcement logic changed.

### M1-21 `fetch_host.rs` gateway-transport-fallback host scope unconfirmed

1. `Status`: `done`
2. `Priority`: `P3`
3. `Files`:
- `browser/src-tauri/src/fetch_host.rs` (`default_fetch_transport_fallback`)
- `transport-rust/src/gateway.rs`
4. `Finding`:
- `default_fetch_transport_fallback()` (the gateway-bridged fallback path for failed `wap`/`waps` GET requests) reads `WAVES_FETCH_TRANSPORT_FALLBACK` with no host/scope restriction visible in `fetch_host.rs` itself; enforcement of where the `GatewayBridged` profile can actually connect lives entirely in `transport-rust`/`gateway.rs`, outside this file's audit scope when it was originally reviewed.
5. `Recommendation`:
- Confirm (with a test, not just a read-through) that the gateway transport path is constrained the same way `native_fetch` is — i.e. it can't be pointed at an arbitrary host via this fallback env var.
6. `Accept`:
- A test demonstrates the gateway-fallback path cannot be redirected to an arbitrary non-configured host.
7. `Resolution`: **Invariant confirmed to hold — no gap found.**
- `WAVES_FETCH_TRANSPORT_FALLBACK` is a strict two-value enum switch (`disabled` | `gateway-bridged`) parsed in `default_fetch_transport_fallback()`; it carries no host/URL value itself and cannot smuggle one. When it selects the fallback, `fetch_deck_with_transport_executor` always retries with the hardcoded `FetchTransportProfile::GatewayBridged`, which routes through the same `build_gateway_request`/`GATEWAY_HTTP_BASE` machinery pinned by the M1-20 test — never a value derived from the fallback env var, request headers, or the original `wap://` URL's own host/port. Added `fetch_deck_command_gateway_fallback_cannot_be_redirected_by_fallback_env_value` in `browser/src-tauri/src/tests/fetch_commands.rs`, an end-to-end test using the real (unmocked) transport: a native attempt to an unreachable loopback port triggers the fallback, and the fallback is proven to land only on a local TCP listener bound to the test's `GATEWAY_HTTP_BASE`, receiving the original wap path unchanged. No enforcement logic changed.

### M1-22 Residual ad hoc `Result<_, String>` on live transport paths (2026-07-24)

1. `Status`: `todo`
2. `Priority`: `P3`
3. `Files`:
- `transport-rust/src/gateway.rs` (`build_gateway_request`)
- `transport-rust/src/fetch_body.rs` (`ReadBodyError::ReadFailed(String)`)
- `transport-rust/src/wbxml_decoder.rs` (decoder returns `Result<String, String>` throughout)
- `transport-rust/src/wbxml.rs` (`decode_wmlc`)
- `transport-rust/src/native_fetch.rs` (`build_kannel_request_uri`)
- `transport-rust/src/responses.rs` (`decode_textual_wml_payload`, `decode_utf16_payload`)
4. `Finding`:
- The live fetch modules historically used ad hoc `Result<_, String>` while the `network::` subsystem used per-module typed error enums. The M1-18/M1-19 pass (2026-07-24) converted the highest-value call sites it already touched: destination validation/resolution now returns `fetch_policy::FetchDestinationError` (classification is by variant, not by message prefix), and connectionless WSP encode/decode now returns `WspConnectionlessEncodeError`/`WspConnectionlessDecodeError`.
- The remaining `Result<_, String>` surfaces above were deliberately left alone to keep that pass scoped. None of them currently drive a classification decision by string matching, so this is readability/robustness debt rather than a live defect — but each is one refactor away from becoming another string-matched boundary.
5. `Recommendation`:
- Convert the listed functions to typed errors module by module, smallest blast radius first (`gateway.rs`, then `fetch_body.rs`, then `native_fetch::build_kannel_request_uri`, then the WBXML decoder chain, which is the largest and should be its own change).
- Preserve the exact rendered message text at every public boundary; the transport error codes and messages in `FetchDeckResponse` must not change.
- Do not convert error strings that are already asserted verbatim by fixtures without updating the fixture in the same change.
6. `Accept`:
- No live transport module returns a bare `Result<_, String>` for a multi-variant failure.
- Error classification anywhere in `transport-rust` is by type/variant, never by message content.
- `make lint-rust-transport` and `make test-rust-transport` stay green; public error codes and messages are unchanged.

### M1-23 Script error taxonomy label table is hand-mirrored in TypeScript instead of generated (2026-07-24)

1. `Status`: `done`
2. `Priority`: `P3`
3. `Files`:
- `browser/frontend/src/app/browser-presenter.ts` (`SCRIPT_ERROR_CATEGORY_LABELS`)
- `engine-wasm/engine/src/engine_script_types.rs` (`ScriptErrorCategoryLiteral` / the category enum it mirrors)
- `browser/scripts/generate-contract-wrappers.mjs`
- `engine-wasm/contracts/wml-engine.ts`
4. `Finding`:
- `browser-presenter.ts` defines `SCRIPT_ERROR_CATEGORY_LABELS` as a hand-written `Record<string, string>` mapping each script-error category to a human-facing label, with a comment above it admitting it "mirrors the engine's `ScriptErrorCategoryLiteral` taxonomy." Nothing generates this table and nothing drift-checks it against the Rust enum it mirrors — it is exactly the cross-language duplication pattern `M1-11`/`M1-12` closed for wire *types*, but that codegen pipeline was never extended to cover human-facing label/taxonomy *tables*. A new script-error category added to the engine falls back to a generic label in the host UI until someone remembers to hand-edit this unrelated file.
5. `Recommendation`:
- Extend `browser/scripts/generate-contract-wrappers.mjs` (or a small sibling generator) to emit the label table from the Rust source of truth — either from doc comments/attributes on the enum variants, or from a small `#[derive]`-driven constant table exported alongside the existing `ts-rs` contract types — and have `browser-presenter.ts` import the generated table instead of hand-authoring it.
- Cover this under `pnpm --dir browser run contracts:check` so a missing/stale label fails CI the same way a stale wire type does today.
- This is a small, scoped codegen extension, not a new pipeline; do not build a second, parallel generator.
6. `Accept`:
- `SCRIPT_ERROR_CATEGORY_LABELS` (or its replacement) is generated, not hand-authored.
- Adding a new script-error category on the Rust side and forgetting the TypeScript label fails `contracts:check` instead of silently falling back to a generic label.
- No behavior change to today's rendered labels.
7. `Resolution`:
- `ScriptErrorCategoryLiteral`, its serialized literals, and its UI labels now come from one macro-backed Rust definition in `engine_script_types.rs`; the `none` fallback remains intentionally unlabeled.
- The existing Rust contract generator emits `SCRIPT_ERROR_CATEGORY_LABELS` into `browser/contracts/generated/engine-host.ts`, and the existing AST wrapper generator discovers and re-exports that value from `browser/contracts/engine.ts`.
- Contract generation rejects any non-fallback category whose Rust metadata has no label. A focused generator regression covers that rejection, and an end-to-end temporary-category check confirmed `pnpm --dir browser run contracts:check` exits nonzero with the missing category named in the error.
- `browser-presenter.ts` imports the generated table. Presenter tests pin all four existing labels and preserve the generic `script error` fallback for `none`, unknown, and absent categories.
- `engine-wasm/contracts/wml-engine.ts` is unchanged because the runtime wire shape and semantics did not change; the generated table is host presentation metadata, not a new engine method or payload field.

### M1-24 `M1-15` Files reference cites a path that no longer exists (2026-07-26)

1. `Status`: `done`
2. `Priority`: `P3`
3. `Depends On`: `M1-15`
4. `Files`:
- `docs/waves/MAINTENANCE_WORK_ITEMS.md` (`M1-15` `Files` list)
5. `Finding`:
- `M1-15`'s `Files` list cites `engine-wasm/engine/src/engine_tests.rs`. That path no longer exists — it was split into a module directory (`engine-wasm/engine/src/engine_tests/`, containing `mod.rs`, `navigation_metadata.rs`, `panic_containment.rs`, and others), most likely as collateral from `M1-08` ("Split high-churn files into boundary modules"), which doesn't call out this specific split in its own `Files` list. The behavior `M1-15` documents (deterministic rejection of pathological nesting depth) is still correctly implemented and tested, just at `engine-wasm/engine/src/engine_tests/navigation_metadata.rs:38` instead of the cited path. Per this repo's Backlog Lifecycle Policy, `M1-15` itself is not edited; this is filed as the required additive corrective follow-up.
6. `Recommendation`:
- Note the corrected path here rather than editing `M1-15`'s historical record.
7. `Accept`:
- A reader following `M1-15`'s `Files` list to verify its regression coverage is pointed at the correct current location.
8. `Resolution`:
- The regression coverage `M1-15` describes lives at `engine-wasm/engine/src/engine_tests/navigation_metadata.rs:38`, not `engine-wasm/engine/src/engine_tests.rs`. No code or test changes were needed; this entry exists solely to correct the stale path reference without rewriting `M1-15`'s original record.

### M1-25 Active compliance rollup guard missed contradictory status totals (2026-07-27)

1. `Status`: `done`
2. `Priority`: `P2`
3. `Depends On`: `CONF-006`, `M0-08`
4. `Files`:
- `scripts/check-active-compliance-facts.mjs`
- `scripts/check-requirement-status-drift.mjs`
- `scripts/tests/check-active-compliance-facts.test.mjs`
- active compliance and planning rollups
5. `Finding`:
- The canonical manifests reported 40 implemented / 71 partial / 87 missing selected parents and 28 done / 1 blocked / 11 in-progress / 42 todo work items, while the planning table and several active summaries retained older values. Both drift checks passed because one accepted the stale table literally and the other found the current counts elsewhere in the same document.
6. `Build`:
- Derive and require the exact parent-status table, work-item counts, WML evidence-state counts, and key compliance-program transport/WML summaries from canonical inputs.
- Correct active prose without changing canonical evidence or reopening completed work items.
7. `Tests`:
- `node --test scripts/tests/check-active-compliance-facts.test.mjs`
- `node scripts/check-active-compliance-facts.mjs`
- `node scripts/check-requirement-status-drift.mjs`
8. `Accept`:
- A stale aggregate table or WML evidence-state count fails deterministically even when a correct value appears elsewhere in the same document.
9. `Resolution`:
- The guard now checks the exact derived fragments, and focused regressions prove both previously missed drift cases.

### M1-26 Suppress automatic re-follow of a terminally failed external intent (2026-07-29)

1. `Status`: `done`
2. `Priority`: `P1`
3. `Depends On`: `WML-205`
4. `Files`:
- `browser/frontend/src/app/browser-controller.ts`
- `browser/frontend/src/app/engine-timer-runtime.ts`
- focused browser controller/timer tests and native failure-path E2E coverage
5. `Finding`:
- A stale public origin compiled the static example as WML 1.1. The strict WML 1.3 decoder correctly rejected public ID 4, but the invoking engine state retained the pending external navigation intent. Later timer ticks automatically followed that same terminally failed intent again, producing 97 identical origin requests in about 7.7 seconds.
- Correcting the origin removes the immediate trigger but does not close this independent client resilience gap. Broadening the WBXML decoder would mask both problems and is out of scope.
6. `Build`:
- After a terminal external-intent fetch failure, preserve the invoking card and failed intent for inspection and explicit user retry, while suppressing automatic re-follow of that same intent.
- Clear the suppression only for a distinct engine intent, a successful navigation, or an explicit user retry action.
7. `Tests`:
- Prove one terminal WBXML failure produces one fetch, a stable visible error, and no additional origin request over a bounded observation window.
- Preserve existing success, distinct-intent, timer, and manual-retry behavior.
8. `Accept`:
- Timer ticks cannot turn one terminal external-navigation failure into repeated network requests.
- The original card and failed intent remain available for diagnosis and explicit retry.
- No decoder compatibility broadening or service-side workaround is used to hide the client state bug.
9. `Resolution`:
- The browser records the failed intent's resolved request identity and navigation generation at the
  terminal host boundary. Automatic timer re-follow is suppressed without mutating the engine,
  while explicit Reload/Go and distinct intents remain eligible for one fresh attempt.
- A bounded WBXML regression covers 50 timer ticks, state/history preservation, notification
  deduplication, explicit retry, distinct-intent admission, and successful recovery.

### M1-27 CI maintenance audit and deterministic documentation checks (2026-07-30)

1. `Status`: `done`
2. `Priority`: `P1`
3. `Depends On`: `M0-09`
4. `Files`:
- `.github/workflows/ci.yml`
- `.github/workflows/security.yml`
- `.github/workflows/transport-wap-smoke.yml`
- `.github/workflows/native-tauri-kannel-e2e.yml`
- `scripts/check-active-doc-links.mjs`
- `scripts/tests/ci-path-routing.test.mjs`
- `docs/ci/CI_MAINTENANCE.md`
5. `Finding`:
- Recent Actions evidence put the native Kannel pilot at a 15m44s median, transport smoke at
  10m13s, and Security at 11m33s. Rebuilding patched Kannel from source, reinstalling pinned tools,
  and running the optional image scan on unrelated PRs dominated those paths.
- Active Markdown had schema/drift coverage but no deterministic repository-file and anchor check;
  applying Prettier globally would introduce 2,292 unrelated file rewrites.
6. `Build`:
- Add content-addressed BuildKit caches, exact pinned-tool caches with version verification,
  PR-only supersession cancellation, optional image-audit selection, and contract-routing fixtures.
- Add an offline active-document file/anchor checker that excludes archives and dated historical
  snapshots by policy.
7. `Tests`:
- `pnpm docs:check`
- `pnpm verify:test`
- `actionlint -ignore 'constant expression "false"' .github/workflows/*.yml`
- `sh -n scripts/native-tauri-kannel-e2e.sh`
- `shellcheck scripts/native-tauri-kannel-e2e.sh`
8. `Accept`:
- Authentic Kannel/WBXML, native UI, diagnostic artifact, and teardown coverage remains intact.
- Required contexts still report; optional image scans remain mandatory for affected PRs and every
  push to `main`.
- Cache invalidation is explicit and no secret, runtime state, or test result is cached.
9. `Resolution`:
- The focused maintenance batch and measured baseline are documented in
  `docs/ci/CI_MAINTENANCE.md`; warm-run timing remains a post-PR evidence update rather than an
  assumed result.

### M1-03 Engine API generator design and bootstrap (non-priority)

1. `Status`: `todo`
2. `Files`:
- `engine-wasm/contracts/wml-engine.ts`
- `browser/contracts/engine.ts`
- `scripts/` (new generator entrypoint)
- `docs/waves/CONTRACT_REQUIREMENTS_MAPPING.md`
3. `Build`:
- Add a generator path that can emit TypeScript engine API/types/facade scaffolding from engine-owned source metadata.
- Keep this item as non-priority within the sprint (design/prototype unless explicitly promoted).
4. `Tests`:
- Generator dry-run in CI or local script check.
5. `Accept`:
- Manual engine API sync burden is reduced with a documented generate path and prototype output.

### M1-08 Split high-churn files into boundary modules

1. `Status`: `done`
2. `Files`:
- `engine-wasm/engine/src/lib.rs` (done)
- `engine-wasm/engine/src/engine_runtime_internal.rs` + `engine_runtime_internal/*` (done)
- `engine-wasm/engine/src/parser/wml_parser/*` (done)
- `browser/frontend/src/main.ts` (done)
- `browser/src-tauri/src/lib.rs` + `browser/src-tauri/src/engine_bridge/*` + `browser/src-tauri/src/tests/*` (baseline split done)
- `transport-rust/src/lib.rs` + `transport-rust/src/fetch_runtime/*` + `transport-rust/src/tests/*` (baseline split done)
- `browser/frontend/src/app/browser-controller.ts` + `browser/frontend/src/app/shell-event-bindings.ts` + `browser/frontend/src/app/keyboard-intent-router.ts` (residual split done)
3. `Build`:
- Move code into boundary modules (`api`, `state`, `actions`, `mapping`, `ui`) without broad behavior changes.
4. `Tests`:
- Existing project test/build commands remain green.
5. `Accept`:
- High-churn files are reduced and responsibilities are easier to review.
6. `Notes`:
- Engine-side decomposition has landed and merged.
- Browser and transport boundary decomposition baselines have landed.
- Browser-side follow-up landed additional probe/timer/focused-edit coordinators in `#109`.
- Residual cleanup landed: `browser-controller.ts` (1021 lines) still mixed shell/DOM
  event-listener binding, run-mode orchestration, keyboard-intent routing/queueing, and
  transport-URL loading. Extracted two more boundary modules following the existing
  constructor-injected coordinator pattern: `ShellEventBindings` (DOM listener wiring --
  binds/unbinds all shell button/input/window event listeners against a caller-supplied
  action map, owns the `#btn-back` element directly) and `KeyboardIntentRouter`
  (keyboard-intent resolution/routing plus the serialized keyboard action queue that
  guards against interleaving with a concurrent engine timer tick). BrowserController
  still defines what each routed action does and owns run-mode orchestration and
  transport-URL loading directly; it is now 764 lines. Both new modules have their own
  isolated unit tests (`shell-event-bindings.test.ts`, `keyboard-intent-router.test.ts`).
  No behavior changes; this was a pure structural extraction.
- Remaining scope is residual opportunistic cleanup only if new hot files emerge or a boundary proves unstable under feature work; do not let this preempt active compliance/runtime tickets.

### M1-09 Engine-host frame interface migration execution

1. `Status`: `todo`
2. `Files`:
- `docs/waves/ENGINE_HOST_FRAME_MIGRATION_PLAN.md`
- `docs/waves/ENGINE_HOST_FRAME_WORK_ITEMS.md`
- `engine-wasm/contracts/wml-engine.ts`
- `browser/src-tauri/src/contract_types.rs`
- `browser/contracts/generated/engine-host.ts`
3. `Build`:
- Execute the `F0-F4` migration program to move active hosts onto structured frame/input contracts.
- Keep migration additive and parity-gated until legacy path retirement.
4. `Tests`:
- `cd engine-wasm/engine && cargo test`
- `cd browser/src-tauri && cargo test`
- `pnpm --dir browser/frontend test`
- `pnpm --dir browser/frontend build`
5. `Accept`:
- Active host paths use `EngineFrame` + `EngineInputEvent`.
- Contract and coverage docs are updated in the same migration PRs.

### M1-10 Engine contract parity guardrail hardening

1. `Status`: `done`
2. `Files`:
- `browser/scripts/generate-contract-wrappers.mjs`
- `engine-wasm/contracts/wml-engine.ts`
- `browser/contracts/engine.ts`
- `browser/contracts/generated/engine-host.ts`
- `.github/workflows/ci.yml`
3. `Build`:
- Keep engine contract wrappers generated from generated host-contract exports, not manual sync.
- Enforce drift through deterministic codegen checks in CI (`contracts:check`) and keep wrapper alias surfaces explicit.
4. `Tests`:
- `pnpm --dir browser run contracts:check`
- repo-hygiene CI lane remains green.
5. `Accept`:
- Contract-surface drift across engine canonical, generated host contract, and browser wrapper aliases is blocked for covered contract types.
6. `Notes`:
- Parity-script lane retired in favor of generator-owned wrappers plus codegen drift checks.
- Guardrail now enforced through `contracts:check` in repo hygiene and browser-shell CI lanes.

### M1-11 Browser contract-wrapper codegen alignment

1. `Status`: `done`
2. `Files`:
- `browser/contracts/engine.ts`
- `browser/contracts/transport.ts`
- `browser/contracts/generated/*`
- `browser/src-tauri/src/bin/generate_contracts.rs`
- `browser/scripts/generate-contract-wrappers.mjs`
3. `Build`:
- Make browser wrapper contracts thin generated aliases/adapters with no duplicate hand-authored shape definitions.
- Ensure wrapper drift checks fail if wrapper outputs diverge from generated source contracts.
4. `Tests`:
- `pnpm --dir browser/frontend exec tsc --noEmit`
- `pnpm --dir browser run contracts:check` in repo hygiene lane.
5. `Accept`:
- Browser contract wrappers no longer require manual shape synchronization beyond intentional adapter aliases.
6. `Notes`:
- Contract wrapper generation now emits `browser/contracts/engine.ts` and `browser/contracts/transport.ts` from `browser/scripts/generate-contract-wrappers.mjs`.
- App-specific transport session/history types moved to `browser/contracts/transport-app.ts` to keep generated wrappers contract-focused.
- Wrapper generation now runs through `browser/scripts/generate-contract-wrappers.mjs` with AST-derived export sets from generated contract files (no static wrapper blobs in Rust).
- CI drift enforcement for wrappers/contracts uses `pnpm --dir browser run contracts:check`.

### M1-12 Engine/transport error taxonomy artifact generation

1. `Status`: `done`
2. `Files`:
- `browser/contracts/generated/engine-host.ts`
- `browser/contracts/generated/transport-host.ts`
- `browser/contracts/engine.ts`
- `browser/contracts/transport.ts`
- `browser/scripts/generate-contract-wrappers.mjs`
- `docs/waves/SPEC_TEST_COVERAGE.md`
3. `Build`:
- Keep transport and engine error-taxonomy surfaces sourced from generated contracts and wrapper aliases.
- Avoid parallel manual error-union definitions outside generated/wrapper contract modules.
4. `Tests`:
- `pnpm --dir browser run contracts:check`
- Browser/frontend typecheck validates alias consumer compatibility.
5. `Accept`:
- Error-code/class/category surfaces are generated and parity-checked instead of manually synchronized.
6. `Notes`:
- Standalone taxonomy fixture/check lane retired.
- Taxonomy drift control now relies on generated contract source + wrapper codegen drift checks.
- Transport and engine consumer surfaces use generated contract exports/aliases rather than duplicated manual unions.

### M1-13 Contract schema fixture generation and validation lane

1. `Status`: `done`
2. `Files`:
- `browser/contracts/generated/*`
- `engine-wasm/contracts/wml-engine.ts`
- `browser/contracts/engine.ts`
- `browser/contracts/transport.ts`
- `browser/scripts/generate-contract-wrappers.mjs`
- `.github/workflows/ci.yml`
3. `Build`:
- Keep wrapper contract generation deterministic and derived from generated contract modules.
- Keep CI focused on codegen drift checks and compile-time consumer validation rather than additional parallel parity scripts.
4. `Tests`:
- `pnpm --dir browser run contracts:check`
- `pnpm --dir browser/frontend exec tsc --noEmit`
5. `Accept`:
- Contract drift checks are codegen-driven and resilient to formatting/ordering changes.
6. `Notes`:
- AST-driven wrapper generation landed in `browser/scripts/generate-contract-wrappers.mjs`.
- Standalone parity-schema fixtures/scripts retired in favor of codegen-first drift checks.

### M0-07 Historical backlog pruning pass

1. `Status`: `todo`
2. `Files`:
- `docs/waves/WORK_ITEMS.md`
- `docs/waves/WORK_ITEMS_ARCHIVE.md` (new)
- `docs/waves/MAINTENANCE_WORK_ITEMS.md`
- `README.md`
3. `Build`:
- Move pre-implementation kickoff/planning-only ticket groups that are no longer actionable into a dedicated archive file (`docs/waves/WORK_ITEMS_ARCHIVE.md`), not inline in active boards.
- Keep active queues focused on executable work items only.
4. `Tests`:
- Manual consistency pass for active-vs-archive file boundaries, status markers, and README references.
5. `Accept`:
- Active boards only contain actionable work; historical tickets remain preserved in archive file with traceable IDs.

### M0-08 Cross-board status sync cadence

1. `Status`: `todo`
2. `Files`:
- `docs/waves/WORK_ITEMS.md`
- `docs/waves/WORK_ITEMS_ARCHIVE.md`
- `docs/waves/MAINTENANCE_WORK_ITEMS.md`
- `browser/README.md`
- `engine-wasm/README.md`
- `transport-rust/README.md`
- `README.md`
3. `Build`:
- Define and document a standing rule: when a ticket status changes, update corresponding board and README “next slice/checklist/snapshot” pointers in the same PR.
- Keep updates additive and deterministic across layers.
4. `Tests`:
- Manual PR checklist verification against one representative ticket transition.
5. `Accept`:
- Status transitions no longer leave board/readme mismatches after merge.

### M0-09 Board file-reference hygiene sweep

1. `Status`: `todo`
2. `Files`:
- `docs/waves/WORK_ITEMS.md`
- `docs/waves/WORK_ITEMS_ARCHIVE.md`
- `docs/waves/MAINTENANCE_WORK_ITEMS.md`
- `docs/wml-engine/work-items.md`
- `engine-wasm/README.md`
- `browser/README.md`
- `transport-rust/README.md`
3. `Build`:
- Run a docs reference sweep to replace stale file paths and module names after refactors (for example parser/module splits).
- Ensure file references in tickets remain specific enough to guide implementation but avoid dead-path drift.
4. `Tests`:
- Manual path-existence pass for referenced file paths in active and archive boards.
5. `Accept`:
- Board/readme file references resolve to existing paths or clearly intentional globs; no known dead file paths remain.

### M0-10 Archive index and movement policy

1. `Status`: `todo`
2. `Files`:
- `docs/README.md`
- `docs/waves/WORK_ITEMS.md`
- `docs/waves/WORK_ITEMS_ARCHIVE.md`
- `docs/waves/MAINTENANCE_WORK_ITEMS.md`
3. `Build`:
- Add a short “active vs archive” index entry in docs navigation and define when tickets move into archive files.
- Document that archived tickets are historical and reactivation requires new follow-up IDs on active boards.
4. `Tests`:
- Manual docs navigation pass from `docs/README.md` to active and archive boards.
5. `Accept`:
- Contributors can quickly locate active vs archived work boards and follow one consistent archival rule.
