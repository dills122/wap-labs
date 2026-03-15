# Waves Review 2026-03-15

Branch: `codex/waves-review-remediation-plan`

## Scope reviewed

- `browser/frontend/src/app/*`
- `browser/frontend/src/session-history.ts`
- `browser/frontend/src/components/primitives/wml-render-primitives.ts`
- `browser/src-tauri/src/*`
- `browser/contracts/*`
- `engine-wasm/contracts/wml-engine.ts`
- active planning docs in `docs/waves/*`

Validation run during review:

- `pnpm --dir browser/frontend test`
- `cargo test` in `browser/src-tauri`

Current result: reviewed browser-facing control flow is functionally green, but the main improvement opportunities are concentrated in responsiveness, hot-path churn, and boundary clarity rather than failing behavior.

## Findings

### 1. P1: network-mode startup and mode switches are still on a blocking path

Evidence:

- [`browser-controller.ts`](/Users/dsteele/repos/wap-labs/browser/frontend/src/app/browser-controller.ts#L106) awaits `setRunMode(...)` during init.
- [`browser-controller.ts`](/Users/dsteele/repos/wap-labs/browser/frontend/src/app/browser-controller.ts#L401) awaits `runStartupNetworkProbe()` whenever network mode is entered.
- [`browser-controller.ts`](/Users/dsteele/repos/wap-labs/browser/frontend/src/app/browser-controller.ts#L1064) retries fetches with delays before surfacing the unavailable state.

Impact:

- shell readiness and mode-change completion are coupled to transport probe timing
- user-visible lag risk remains exactly where `A5-07` says it does
- this also makes follow-up cleanup harder because UI state and async probe state are interleaved

Recommendation:

- execute `A5-07` first
- move probe execution behind an explicit backgroundable controller/service boundary
- keep mode state updates synchronous and deterministic, then feed probe results back as state events

### 2. P1: local-mode timer ticks always render, even on no-op snapshots

Evidence:

- [`navigation-state.ts`](/Users/dsteele/repos/wap-labs/browser/frontend/src/app/navigation-state.ts#L280) already avoids render churn for no-op network timer ticks via `shouldRenderTimerSnapshot(...)`.
- [`browser-controller.ts`](/Users/dsteele/repos/wap-labs/browser/frontend/src/app/browser-controller.ts#L1009) always snapshots, renders, and syncs local mode on every timer interval.

Impact:

- unnecessary engine render calls and DOM writes on every timer tick
- extra pressure on the same UI thread already called out by `A5-07`
- local and network modes now have different performance behavior for the same timer semantics

Recommendation:

- extract a shared timer-update policy and reuse it in both modes
- add targeted tests proving no-op ticks do not redraw in local mode

### 3. P2: `BrowserController` remains the dominant hot file and owns too many responsibilities

Evidence:

- [`browser-controller.ts`](/Users/dsteele/repos/wap-labs/browser/frontend/src/app/browser-controller.ts) is 1131 lines and combines:
  - shell event binding
  - run-mode orchestration
  - startup probing
  - transport navigation
  - timer runtime
  - focused input/select edit flows
- existing controller coverage is narrow compared with the file’s surface area; current direct controller test coverage is mainly [`browser-controller.select-edit.test.ts`](/Users/dsteele/repos/wap-labs/browser/frontend/src/app/browser-controller.select-edit.test.ts)

Impact:

- small behavior changes will keep landing in one file
- startup/probe/timer bugs are harder to isolate and test
- `M1-08` is still active in exactly the browser hotspot the repo already identified

Recommendation:

- continue `M1-08` in small boundary-only slices
- first split candidates:
  - startup/run-mode coordinator
  - timer runtime coordinator
  - focused control-edit handler
  - DOM listener wiring

### 4. P2: session/presenter updates rely on repeated whole-object serialization and full debug-panel rewrites

Evidence:

- [`navigation-state.ts`](/Users/dsteele/repos/wap-labs/browser/frontend/src/app/navigation-state.ts#L87) uses `JSON.stringify(a) === JSON.stringify(b)` to detect session changes.
- [`browser-presenter.ts`](/Users/dsteele/repos/wap-labs/browser/frontend/src/app/browser-presenter.ts#L43) rewrites full session JSON on every state update.
- [`browser-presenter.ts`](/Users/dsteele/repos/wap-labs/browser/frontend/src/app/browser-presenter.ts#L64) rewrites the full timeline JSON on every event.
- [`browser-presenter.ts`](/Users/dsteele/repos/wap-labs/browser/frontend/src/app/browser-presenter.ts#L134) rewrites the full snapshot JSON on every snapshot update.

Impact:

- O(n) serialization work grows with history and timeline size
- debug panels are doing more work than the user-facing shell
- this is not a correctness bug today, but it will amplify the responsiveness problems above

Recommendation:

- treat debug-surface updates as secondary work, not part of the critical path
- replace stringified deep equality with an explicit session-state comparator once the controller split reduces coupling

### 5. P3: host-history fallback performs an avoidable extra render before deciding whether engine back actually handled the action

Evidence:

- [`navigation-state.ts`](/Users/dsteele/repos/wap-labs/browser/frontend/src/app/navigation-state.ts#L290) calls `engineNavigateBack()`
- [`navigation-state.ts`](/Users/dsteele/repos/wap-labs/browser/frontend/src/app/navigation-state.ts#L293) renders that result immediately
- only after that does it determine whether to reload the previous host history entry

Impact:

- extra render work on the host-back path
- potential transient flicker if engine back is a no-op and host-history reload follows immediately

Recommendation:

- defer rendering until after `engineHandled` is known, or make the no-op path state-only

## Dependency readout

- `browser/src-tauri` command/adapter split is in better shape than the frontend controller split; tests are broad and green.
- `browser/contracts/*` and `engine-wasm/contracts/wml-engine.ts` are reasonably aligned; I did not find immediate contract drift.
- the main deferred dependency hardening item still worth pulling forward after frontend responsiveness work is [`M1-16`](/Users/dsteele/repos/wap-labs/docs/waves/MAINTENANCE_WORK_ITEMS.md#L93): payload-size guardrails across transport and engine boundaries.

## Recommended execution order

1. `A5-07` spike to measure and background startup/network probe work.
2. Browser timer-path cleanup so local and network modes share the same no-op render policy.
3. `M1-08` follow-up to split `BrowserController` into boundary modules without behavior changes.
4. Browser debug-surface optimization once controller boundaries are stable.
5. `M1-16` transport/engine payload guardrails.

## Commit cadence

1. `docs(waves): capture browser review findings and remediation order`
2. `refactor(browser): isolate startup probe and run-mode coordination`
3. `perf(browser): skip no-op local timer renders`
4. `refactor(browser): split control-edit and timer runtime modules`
5. `perf(browser): move debug panel serialization off hot paths`
6. `fix(transport): enforce payload size guardrails before decode and parse`

## Notes for implementation

- keep changes additive and localized; do not fold frame-migration work into this series
- do not start `M1-09` from this branch
- when a slice changes behavior across host/runtime boundaries, update contracts/docs in the same change
