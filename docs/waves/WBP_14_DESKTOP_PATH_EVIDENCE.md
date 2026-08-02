# WBP-14 Desktop-Path Evidence Audit

Status: `in-progress` — inventory and drift gate established; release gate not closed

Audit date: 2026-08-02

Audit base: `origin/main` at `dfe2c4c9`

Machine-readable inventory: [`wbp-14-desktop-evidence.json`](wbp-14-desktop-evidence.json)

## Outcome

Waves has a credible native success lane today. The automated pilot drives a production-built Tauri
window through the generated invoke client, Rust host, `transport-rust`, and a controlled Kannel
stack. It proves startup, successful WML rendering/navigation, a bounded repeat request, visible
invalid-address failure, and a subsequent successful recovery.

That is not yet the complete WBP-14 release gate. Of 19 required evidence scenarios, 3 are complete,
7 are partial, 5 are missing, and 4 are blocked by unfinished product slices. In particular, unit or
story evidence for timeout, cancellation, invalid-deck atomicity, and script traps must not be
presented as proof that the native desktop path handles those cases.

## Evidence classes

| Class             | Meaning                                                                                                          | Current use                                           |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `fixture`         | Deterministic story, unit, component, or production-browser evidence without the native desktop/gateway boundary | frame/input parity, history, concurrency, zoom/reflow |
| `native-gateway`  | Real Tauri window through Rust host, transport, and controlled Kannel                                            | startup, successful loads, basic failure/recovery     |
| `packaged-manual` | Packaged application behavior that depends on operating-system integration or assistive technology               | crash recovery and screen-reader smoke                |

Local fixtures and native real-gateway runs remain separate in the inventory. Neither class is used
as a silent substitute for the other.

## Current release-gate view

| Area                                      | State           | What is established                                                                             | Closure needed                                                                                           |
| ----------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Startup and successful gateway navigation | complete        | Native production frontend reaches engine-ready and renders/navigates controlled WML 1.3 decks  | Add a startup budget before calling startup performance complete                                         |
| Softkeys, keyboard, pointer, scrolling    | partial         | Unified input routing, engine frame/affordance, and deterministic scrolling fixture paths exist | Add native pointer/keyboard equivalence and text-entry/modifier coverage                                 |
| Loading phases and ordinary recovery      | partial         | Stale-result/concurrency tests and basic native failure/recovery exist                          | Merge `#544`; measure 100/200 ms presentation budgets and exercise categorized failures natively         |
| History                                   | partial         | Typed replayable POST history and request-shaped engine/browser evidence exist                  | Add native GET, POST, and Back replay cases                                                              |
| Timeout and cancellation                  | missing         | Lower-level behavior is tested                                                                  | Add controlled native cases, cancellation acknowledgement timing, and retained-frame assertions          |
| Invalid deck                              | missing         | `WML-205` engine failure/atomicity story is green                                               | Serve malformed/invalid WML through Kannel and verify categorized native recovery without frame mutation |
| Script trap                               | missing         | `WMLS-501` decoder/verifier evidence exists                                                     | Add a native visible trap/recovery case; do not infer unfinished `WMLS-502` execution coverage           |
| Crash recovery and safe session           | blocked         | Product policy is documented                                                                    | Implement `WBP-12` crash marker and safe-session offer, then run a packaged relaunch case                |
| Diagnostics and bounded replay            | blocked         | Bounded sanitized Inspector projection exists                                                   | Implement `WBP-13` `.waves-session.json` import/replay and the 1,000-step memory gate                    |
| Zoom/reflow                               | complete        | Production-built Chromium is green at both windows and effective 200 percent zoom               | Retain as fixture evidence; packaged platform checks remain separate                                     |
| Screen reader                             | blocked         | Manual VoiceOver procedure is documented                                                        | Enable packaging and record the packaged macOS smoke result                                              |
| Interaction latency and memory            | missing/blocked | No release-budget artifact yet                                                                  | Add repeatable native timings and memory observations after the WBP-13 replay path exists                |

## Pending implementation contribution

PRs `#541`, `#542`, `#543`, and `#545` are included in the refreshed audit base. Their typed
POST-history, deterministic scrolling, unified input, and application-shell behavior strengthen
fixture and manual-test coverage, but native desktop-path evidence is still required. This
remaining pull request is not counted as merged behavior:

| PR     | Slice                            | WBP-14 contribution                                               |
| ------ | -------------------------------- | ----------------------------------------------------------------- |
| `#544` | phase-aware loading and recovery | supplies WBP-11 presentation/recovery behavior and timing targets |

## Compliance mapping posture

The inventory maps scenarios only to requirements supported by the narrow context packs retrieved
for this slice:

- `WML-205` supports invalid-deck/error atomicity mapping to `RQ-RMK-002`, `RQ-RMK-003`, and
  `RQ-RMK-012`. The native invalid-deck scenario remains missing.
- `WML-309` supports engine-owned frame/affordance mapping to `RQ-RMK-002`. Pending F2 work must
  still join the native/WASM parity gate.
- `WMLS-501` supplies decoder/verifier evidence, but its selected family still contains partial and
  missing SCR evidence and does not close WMLScript execution.
- `TRN-704` and `TRN-705` have no direct clause mappings. `TRN-706` and `TRN-707` declare WTP scope
  without direct WTP mappings. The native success path does not erase those explicit gaps.

## Reproduce the current evidence

With Node.js 22.22.1 and repository dependencies installed:

```bash
pnpm evidence:desktop:check
pnpm docs:check
pnpm verify:test
```

On Linux with the pinned Tauri/WebDriver tools, Docker, and X11:

```bash
xvfb-run -a make smoke-native-tauri-kannel-ui
```

Rendered browser accessibility evidence is reproduced with:

```bash
pnpm --dir browser/frontend test:accessibility:rendered
```

The native workflow uploads screenshots, page source, environment, service logs, cleanup state, and
`evidence.json`. A green pilot means only the assertions declared by that artifact passed.

## Closure order

1. Merge the pending phase-recovery slice; rerun stories, parity, rendered
   accessibility, and native success evidence for the combined browser.
2. Extend the controlled Kannel origin and native UI driver with timeout, actual cancellation,
   invalid-deck, and script-trap cases. Each case must assert retained committed frame, categorized
   status, correlation metadata, and successful recovery.
3. Complete `WBP-12`, then record launch-after-crash and safe-session policy behavior in a packaged
   build.
4. Complete `WBP-13`, then record sanitized replay determinism and bounded 1,000-step memory
   behavior.
5. Add repeatable startup/interaction budgets and record the packaged VoiceOver smoke.
6. Set `releaseComplete` only after every required inventory row is complete. The validator rejects
   an optimistic closure while any required row remains partial, missing, or blocked.
