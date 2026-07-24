# Waves Usability & Resilience Backlog (2026-07-24)

Follow-up backlog from a usability/graceful-failure audit of the Waves browser
frontend, grounded against Chromium's own stated design principles ("no god
objects," "content not chrome," keyboard/screen-reader access as core not
afterthought), Firefox's network-error-page pattern (plain-language error +
visible retry), and Nielsen Norman's usability heuristics (visibility of
system status; help users recognize, diagnose, and recover from errors;
consistency and standards).

Sources: [Chromium browser design principles](https://chromium.googlesource.com/chromium/src/+/lkgr/docs/chrome_browser_design_principles.md), [Chromium User Experience](https://www.chromium.org/user-experience/), [NN/g 10 usability heuristics](https://www.nngroup.com/articles/usability-heuristics-complex-applications/), [Firefox network error page design](https://wiki.mozilla.org/Firefox/Projects/Network_Error_Pages).

The higher-severity items from this same audit pass (WMLScript dialog
visibility, frozen first-load skeleton, toast queueing, uniform
fetch-failure toasting, focused-link/softkey ARIA) were fixed directly —
see the PR that lands alongside this doc. This file tracks what was
deliberately deferred.

## How to use

Same convention as `MAINTENANCE_WORK_ITEMS.md`: each entry is a
self-contained story with status/priority/files/finding/recommendation/
acceptance. Pull one into a branch when picked up; update status in place.

## Current queue

### U1 No progress indication on repeat navigations

1. `Status`: `done`
2. `Priority`: `P2`
3. `Files`:
- `browser/frontend/src/app/browser-controller.ts` (navigation trigger sites)
- `browser/frontend/src/app/browser-presenter.ts`
- `browser/frontend/src/components/status-panel.ts`
4. `Finding`:
- The shimmering skeleton loading state only ever shows for the very first deck render (`needsFirstRenderSkeleton = !this.presenter.hasRenderedDeck()`). Every subsequent navigation (link click, reload, back/forward, external intent) has zero in-progress indicator beyond a status-panel text color change — the viewport itself just sits static with the old content until the new response lands.
- Under real network latency (`WAVES_CONFIG.transportFetchTimeoutMs` = 5000ms plus a retry), a slow-but-working load is visually indistinguishable from a stuck one unless the user is actively watching the status panel text.
5. `Recommendation`:
- Reuse the existing skeleton/progress affordance (or a lighter inline spinner) for every navigation, not just the first, gated by a short delay (e.g. only show if the fetch hasn't resolved within ~150-200ms) so instant local-mode loads don't flash it unnecessarily.
6. `Accept`:
- Any navigation that takes longer than the short delay threshold shows a visible in-progress state in the viewport itself, not just the status panel.

### U2 Deck-parse and script-trap errors are indistinguishable from network errors

1. `Status`: `done`
2. `Priority`: `P2`
3. `Files`:
- `browser/frontend/src/app/navigation-state.ts` (`EngineRuntimeSnapshot` fields: `lastScriptExecutionOk`, `lastScriptExecutionTrap`, `lastScriptExecutionErrorClass`, `lastScriptExecutionErrorCategory`)
- `browser/frontend/src/app/browser-controller.ts`
- `browser/frontend/src/app/waves-copy.ts`
4. `Finding`:
- The engine already exposes a proper error taxonomy for script traps (`lastScriptExecutionErrorClass`/`errorCategory`), but the frontend only reads these fields for render change-detection (`engineSnapshotsEqual`) — never to change a status message or visual state. A malformed WML payload, a network timeout, and a WMLScript fatal trap all produce the exact same generic "error" status-panel text today.
5. `Recommendation`:
- Branch the status/toast message on the actual failure category (network vs. malformed-payload vs. script-trap) using data the engine already computes, so users (and anyone debugging a deck) can tell which layer failed without opening the dev drawer.
6. `Accept`:
- The three failure classes produce visibly distinct, correctly-worded status messages.

### U3 Back button never reflects "no history" state

1. `Status`: `done`
2. `Priority`: `P3`
3. `Files`:
- `browser/frontend/src/app/browser-controller.ts`
- `browser/frontend/src/app/browser-shell-template.ts`
4. `Finding`:
- `#btn-back` is never disabled, even when there is provably no back history (`navigateBackWithFallback` returns `'none'`). Both Chrome and Firefox dim/disable their back button at the start of history as a passive "don't bother" signal rather than requiring the user to click and read a status message.
5. `Recommendation`:
- Track back-availability in render state and toggle `disabled`/`aria-disabled` on `#btn-back` accordingly. Low effort, matches an established platform convention.
6. `Accept`:
- Back button is disabled exactly when there is no engine or host history to go back to.

### U4 Color palette hardcoded and duplicated, no shared design tokens

1. `Status`: `done`
2. `Priority`: `P3`
3. `Files`:
- `browser/frontend/src/styles.css`
- `browser/frontend/src/components/status-panel.ts`
- `browser/frontend/src/components/surface-panel.ts`
- `browser/frontend/src/vendor/win95/win95.css` (read-only reference, third-party)
4. `Finding`:
- Only `--motion-fast`/`--motion-base`/`--ease-standard`/`--waves-teal` exist as CSS custom properties. Everything else (status-panel tones, toast tones, win95-gray palette) is hardcoded hex, repeated independently in `styles.css` and inline in each Lit component's `static styles`.
5. `Recommendation`:
- Extract a small shared token set (status/toast semantic colors at minimum) into `:root` custom properties, consumed by both plain CSS and the Lit components' `css` templates.
6. `Accept`:
- Status/toast/error colors are defined once and referenced everywhere, not restated.

### U5 No runtime-configurable timeout/contrast/font-size

1. `Status`: `todo`
2. `Priority`: `P4` (likely won't do — flagging for a scope decision, not recommending)
3. `Files`:
- `browser/frontend/src/app/waves-config.ts`
4. `Finding`:
- All UX-relevant timing/behavior constants (`transportFetchTimeoutMs`, `transportFetchRetries`, `networkProbeMaxAttempts/DelayMs/TimeoutMs`, `toastTtlMs`, `engineTimerTickMs`) are compile-time constants with no UI to change them at runtime; same for any visual accessibility preference (contrast, font size).
5. `Recommendation`:
- Before investing here, get an explicit call on scope: AGENTS.md frames this repo as a deterministic MVP emulator, not a modern-browser feature-parity target. This may be intentionally out of scope. Do not build a settings panel speculatively.
6. `Accept`:
- N/A until a scope decision is made.

### U6 `BrowserPresenter` has no `dispose()` lifecycle symmetry

1. `Status`: `done`
2. `Priority`: `P3`
3. `Files`:
- `browser/frontend/src/app/browser-presenter.ts`
- `browser/frontend/src/app/browser-controller.ts`
4. `Finding`:
- `BrowserPresenter`'s constructor registers a `devDrawerEl.addEventListener('toggle', ...)` with no matching teardown; `BrowserController.dispose()` never disposes its presenter. Currently harmless because `mountBrowserShell` replaces `#app.innerHTML` wholesale on every bootstrap/HMR cycle, dropping the old listener with the old DOM — but the class has no lifecycle symmetry with the controller that owns it.
5. `Recommendation`:
- Add a `dispose()` to `BrowserPresenter` that removes its listener(s); call it from `BrowserController.dispose()`.
6. `Accept`:
- Presenter listeners are torn down explicitly, not just implicitly via DOM replacement.

### U7 Debug-panel full-JSON reserialize on every mutation

1. `Status`: `todo`
2. `Priority`: `P3`
3. `Files`:
- `browser/frontend/src/app/browser-presenter.ts` (`flushDeveloperPanels`)
4. `Finding`:
- When the dev drawer is open, every session/snapshot/timeline mutation re-serializes the entire object graph via `JSON.stringify(..., null, 2)` rather than diffing. Gated behind `devDrawerEl.open` and dirty flags already (better than the original 2026-03-15 review's "every update" finding), but still O(n) per mutation while open.
5. `Recommendation`:
- Not urgent — developer-facing panel, not user-facing. Revisit only if it shows up in real profiling, or bundle into a future `M1-08` follow-up pass.
6. `Accept`:
- N/A — low priority, informational.

### U8 `marketing-site/global.css` is a single 1261-line unsplit stylesheet

1. `Status`: `todo`
2. `Priority`: `P4`
3. `Files`:
- `marketing-site/src/styles/global.css`
4. `Finding`:
- No component-level splitting; will get harder to maintain as the site grows. Not broken today.
5. `Recommendation`:
- Defer until the next marketing-site change that touches styling meaningfully; not worth a standalone pass.
6. `Accept`:
- N/A — cosmetic, low priority.

## Also tracked elsewhere (not duplicated here)

- `BrowserController` god-file decomposition — tracked as `M1-08` in `docs/waves/MAINTENANCE_WORK_ITEMS.md` (status: residual/opportunistic per that ticket's own notes).
- `network::wsp` dead-code-vs-live-fetch-path split — tracked as `M1-18`.
- `fetch_policy.rs` shallow destination-check hardening, gateway-bridged `AllowPrivate` invariant pinning, and `fetch_host.rs` gateway-transport-fallback host-scope confirmation — transport/tauri-layer hardening items surfaced in the same audit; see the maintenance doc entries `M1-19`/`M1-20`/`M1-21` added alongside this file.
- Full field-level IPC response-shape validation (currently only a null/undefined boundary guard) — deliberately partial; revisit as its own scoped design decision (schema library vs. hand-rolled checks), not bundled here.
