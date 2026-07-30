# Waves Failure Containment and Recovery Work Items

Purpose: track the additive browser, Tauri-host, and engine resilience work found by the
2026-07-29 current-main failure-containment audit.

Audit base: `origin/main` `20c3f8eff5e5823a7bdf36ca28da220f6b8a9d74`.

Status keys:

- `todo`
- `in-progress`
- `blocked`
- `done`

## Product Requirement

One malformed request, response, deck, script, timer event, or host/engine failure must not freeze
or crash Waves, create an uncontrolled network storm, corrupt navigation/history state, or prevent
the user from loading a known-good deck. Failures must terminate predictably, expose a useful typed
error, preserve usable state where appropriate, and leave an explicit recovery path.

## Scope and Ownership

- Browser-owned containment stays in `browser/frontend`: navigation admission, failed-intent
  quarantine, recovery UI, history, and diagnostic projections.
- Host/IPC containment stays in `browser/src-tauri`: request validation, cancellation/concurrency,
  typed errors, and transactional engine command adaptation.
- Runtime work/output limits stay in `engine-wasm`: layout/render budgets and native/WASM parity.
- WBXML decoding, transport retry semantics, and network policy stay in `transport-rust`.
- The separately owned public service/deployment/examples work does not satisfy or replace these
  client-side containment items.
- Coordinate `browser-presenter.ts` work with the separate visual-refinement stream; these tickets
  change behavior and data handling, not styling.

## Immediate Containment Gate

`RSL-01` is the immediate release-blocking slice. A backend correction can remove the known public
WBXML trigger, but current main will still replay an equivalent terminal external-intent failure.

## Lane A: Navigation Containment

### RSL-01 Terminal external-intent failure quarantine

1. `Issue`: [#510](https://github.com/dills122/wap-labs/issues/510)
2. `Status`: `done`
3. `Priority`: `P1` release blocker; treat as `P0` for a distributed build exposed to uncontrolled
   public content
4. `Depends On`: none
5. `Files`:
- `browser/frontend/src/app/navigation-state.ts`
- `browser/frontend/src/app/engine-timer-runtime.ts`
- `browser/frontend/src/app/browser-controller.ts`
- focused tests for those modules
6. `Build`:
- Quarantine a terminally failed external intent by request identity plus engine/navigation
  generation.
- Preserve the invoking engine state and pending intent; do not weaken WML-205 rollback behavior by
  clearing engine state.
- Permit a new automatic follow only when intent identity changes, or one explicit attempt when the
  user chooses Reload/retry.
7. `Tests`:
- A `WBXML_DECODE_FAILED` target followed by 50 timer ticks produces one automatic target fetch.
- Explicit Reload causes exactly one new attempt.
- A known-good URL or local deck loads afterward and stops the failed-intent loop.
- The invoking deck, card, history, focus, variables, and pending engine intent remain intact.
8. `Accept`:
- Terminal failure produces one bounded outcome and one useful error surface.
- No timer-driven automatic replay occurs without a changed intent or explicit user action.
9. `Resolution`:
- Browser navigation now quarantines terminally failed external intents by resolved request identity
  and navigation generation without clearing engine state. Timer snapshots suppress the same
  quarantined intent, while explicit Reload/Go and changed intents receive one fresh attempt.
- Focused controller coverage proves one WBXML decode failure plus 50 timer ticks issues one target
  fetch, preserves the invoking state, deduplicates the failure notification, permits one explicit
  retry, and recovers through a changed known-good target.

### RSL-02 Cancellable and admission-controlled navigation

1. `Issue`: [#509](https://github.com/dills122/wap-labs/issues/509)
2. `Status`: `todo`
3. `Priority`: `P1`
4. `Depends On`: `RSL-01`
5. `Files`:
- `browser/frontend/src/app/navigation-state.ts`
- `browser/frontend/src/app/browser-controller.ts`
- `browser/frontend/src/app/shell-event-bindings.ts`
- `browser/src-tauri/src/lib.rs`
- fetch command/client contracts and focused tests
6. `Build`:
- Admit or coalesce one logical navigation operation instead of starting an independent fetch for
  every rapid action.
- Add a cancellable host fetch contract and stop superseded attempts/retries.
- Bound concurrent native fetch tasks while keeping generation checks as the final state-integrity
  guard.
7. `Tests`:
- Eight rapid identical actions produce at most one active fetch.
- Back or a new URL stops superseded work and cannot receive a stale toast, transport-panel update,
  or history mutation.
- A hung response can be cancelled and followed by a successful known-good load.
8. `Accept`:
- Both active work and committed state remain bounded under conflicting navigation.

## Lane B: Engine and Frame Resource Safety

### RSL-03 Transactional frame commands and viewport validation

1. `Issue`: [#508](https://github.com/dills122/wap-labs/issues/508)
2. `Status`: `todo`
3. `Priority`: `P1`
4. `Depends On`: none
5. `Files`:
- `browser/frontend/src/app/browser-controller.ts`
- `browser/src-tauri/src/contract_types.rs`
- `browser/src-tauri/src/engine_bridge/engine_adapter.rs`
- `engine-wasm/engine/src/engine_public_api.rs`
- native/WASM/Tauri boundary tests
6. `Build`:
- Define and validate one shared viewport range before engine mutation.
- Make every mutating frame command transactional: construct a valid candidate frame before commit
  or restore the exact previous engine state when frame construction fails.
- Return a typed invalid-input or resource error rather than a generic parse string.
7. `Tests`:
- `u32::MAX + 1` fails before mutation.
- Forced frame failure after load, input/key, timer, Back, edit, and clear-intent preserves the
  complete previous state.
- A valid viewport and known-good deck succeed after each failure.
8. `Accept`:
- No failed frame command leaves engine and frontend state out of sync.

### RSL-04 Bounded, single-pass render output

1. `Issue`: [#505](https://github.com/dills122/wap-labs/issues/505)
2. `Status`: `todo`
3. `Priority`: `P1`
4. `Depends On`: `RSL-03`
5. `Files`:
- `engine-wasm/engine/src/layout/flow_layout.rs`
- `engine-wasm/engine/src/engine_public_api.rs`
- `browser/src-tauri/src/engine_bridge/engine_adapter.rs`
- `browser/frontend/src/app/browser-presenter.ts`
- native/WASM/Tauri/frontend tests
6. `Build`:
- Bound layout rows, segments, draw commands, and serialized frame bytes in the engine.
- Return a typed resource-limit failure with no partial state/presentation commit.
- Derive legacy render and presentation output from one layout pass during migration.
- Retain a defensive frontend output cap before HTML/DOM work.
7. `Tests`:
- Native and WASM fixtures exactly at and one unit above each output limit.
- Rejected pathological output leaves the last good frame visible and a small deck renders next.
- Tauri frame construction proves one layout pass and native/WASM frame parity remains stable.
8. `Accept`:
- Any accepted deck has a deterministic upper bound on render work and host-visible output.

## Lane C: IPC Contract Hardening

### RSL-05 Bounded request ingress and typed host errors

1. `Issue`: [#507](https://github.com/dills122/wap-labs/issues/507)
2. `Status`: `todo`
3. `Priority`: `P2`
4. `Depends On`: coordinate after the separate `wapcurl` task releases the overlapping transport
   request/serialization files
5. `Files`:
- `transport-rust/src/lib.rs`
- `transport-rust/src/request_serialization.rs`
- `browser/src-tauri/src/lib.rs`
- `browser/src-tauri/src/contract_types.rs`
- generated host contracts
- `browser/frontend/src/app/tauri-invoke-guard.ts`
6. `Build`:
- Define aggregate limits for request headers, IDs, POST fields, encoded request bodies, card IDs,
  and edit drafts at their owning Rust boundaries.
- Reject before transport/spawn work and never echo sensitive payloads in error details.
- Generate a typed host error envelope and validate non-null IPC responses structurally without
  hand-copying contract schemas.
7. `Tests`:
- One-over-limit tests for every bounded field and aggregate.
- Invalid request, cancellation, spawn/join, mutex, engine resource, and response-shape failures
  remain distinguishable and recoverable.
- Contract-generation and drift checks pass.
8. `Accept`:
- Malformed IPC terminates predictably before expensive work and all commands remain usable.
9. `Coordination`:
- Do not change `transport-rust/src/request_meta.rs`, transport retry semantics, or `wapcurl` CLI
  exit diagnostics as part of this item.

## Lane D: Diagnostic and UI State Bounds

### RSL-06 Redacted developer and timeline projections

1. `Issue`: [#506](https://github.com/dills122/wap-labs/issues/506)
2. `Status`: `todo`
3. `Priority`: `P2` security
4. `Depends On`: none
5. `Files`:
- `browser/frontend/src/session-history.ts`
- `browser/frontend/src/app/timeline.ts`
- `browser/frontend/src/app/browser-presenter.ts`
- associated history/timeline/presenter tests
6. `Build`:
- Keep exact internal request identity for WML history replay.
- Build explicit allowlisted/redacted developer-panel and export DTOs.
- Redact secret headers, legacy payloads, and typed form values while retaining safe method/count/
  content-type/length metadata.
7. `Tests`:
- PIN/password, Authorization, Cookie, Proxy-Authorization, legacy payload, and typed post-field
  values never appear in panel/export JSON.
- Internal Back still replays the byte-exact original POST.
8. `Accept`:
- Diagnostic artifacts are useful without disclosing replay credentials.

### RSL-07 Bounded toast and host-history state

1. `Issue`: [#504](https://github.com/dills122/wap-labs/issues/504)
2. `Status`: `todo`
3. `Priority`: `P2`
4. `Depends On`: `RSL-06`
5. `Files`:
- `browser/frontend/src/app/browser-presenter.ts`
- `browser/frontend/src/session-history.ts`
- `browser/frontend/src/app/timeline.ts`
- associated tests
6. `Build`:
- Deduplicate and cap identical queued toasts.
- Let successful recovery supersede stale failure notifications.
- Define deterministic oldest-entry history eviction with a documented retained WML back depth.
7. `Tests`:
- 97 identical failures remain within capacity and create one accessible failure announcement.
- A later successful load becomes visible immediately.
- A 10,000-navigation simulation keeps history and exported state bounded while Back/index/forward
  truncation remain deterministic within the retained window.
8. `Accept`:
- UI and host-session collections remain bounded and preserve an obvious recovery signal.

## Dispatch Order and Conflict Map

Recommended first parallel batch:

1. `RSL-01` navigation quarantine
2. `RSL-03` transactional frame commands
3. `RSL-06` diagnostic redaction

Follow with:

1. `RSL-02` after `RSL-01` because both touch navigation/controller ownership.
2. `RSL-04` after `RSL-03` because both touch the engine/Tauri frame boundary.
3. `RSL-07` after `RSL-06` because both touch presenter/history projections.
4. `RSL-05` after the separate `wapcurl` stream releases transport request and serialization files.

Likely conflicts:

- `RSL-01` / `RSL-02`: `navigation-state.ts`, `browser-controller.ts`
- `RSL-03` / `RSL-04`: `engine_adapter.rs`, `engine_public_api.rs`
- `RSL-06` / `RSL-07` / visual refinement: `browser-presenter.ts`
- `RSL-05` / `wapcurl`: `transport-rust/src/lib.rs`, `fetch_runtime.rs`, and
  `request_serialization.rs`
