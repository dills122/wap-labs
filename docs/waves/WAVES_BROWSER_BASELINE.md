# Waves Browser WBP-00/WBP-01 Baseline

Status: accepted baseline
Captured: 2026-07-25 (evidence artifact timestamp is UTC)
Owner lane: `browser`

## Scope and Decisions

This baseline closes the adoption and shell-integration gates for the adopted
**Authentic Core, Modern Console** direction. It is evidence for the current shell, not a visual
golden and not a device-specific compatibility claim.

The initial `Class C Reference` profile uses:

- a neutral, non-vendor identity;
- 20 engine-owned logical columns, matching the existing WaveNav/browser default;
- no browser-authored fixed row count, font metric, softkey precedence, or hit-region model before
  the `WBP-06` frame/input contract;
- a 1024 by 768 CSS-pixel default test viewport and an 880 by 640 CSS-pixel minimum test viewport,
  matching `browser/src-tauri/tauri.conf.json`;
- the existing Up, Select, and Down controls only as the current adapter. They do not imply future
  softkey slots or task precedence.

The primary launch audience assumption is **WAP/WML implementers and emulator evaluators**.
Current evidence is the product's transport-route inspection, correlation/timeline surfaces,
canonical conformance examples, raw debug path, and executable story workflow. Preservationists and
learners remain important secondary audiences; `WBP-04` owns validation and onboarding for them.

## Reference Environment

- MacBook Pro `MacBookPro18,4`
- Apple M1 Max, 10 logical cores
- 64 GB memory
- macOS 26.5.2 (`Darwin 25.5.0`), arm64
- Node.js 22.22.1
- headless Chromium 151.0.7922.34
- production-built `browser-story.html` using the real WaveNav WASM engine and deterministic local
  fixture fetch adapter

The checked-in machine-readable result is
[`evidence/wbp-00-01/baseline.json`](evidence/wbp-00-01/baseline.json). It contains every sample,
environment details, window geometry, tab order, and keyboard activations.

## Baseline Measurements

Twenty samples were captured for each metric:

| Metric           | Boundary                                                                    |     p50 |     p95 |
| ---------------- | --------------------------------------------------------------------------- | ------: | ------: |
| Startup          | navigation start to initial local deck committed and rendered               | 53.8 ms | 57.9 ms |
| Local navigation | local-example change to selected deck committed and rendered                |  7.3 ms |  7.5 ms |
| Input/render     | browser `ArrowUp`/`ArrowDown` event to engine focus plus focused DOM render |  7.3 ms |  7.5 ms |

These numbers describe this reference machine and deterministic local path. They are comparison
baselines, not release budgets and not evidence for native network or gateway latency.

## Reproduce

From the repository root with the pinned Node/pnpm toolchain active:

```bash
cd engine-wasm/engine
wasm-pack build --target web --out-dir ../pkg
cd ../..
WAVES_BASELINE_RUNS=20 pnpm test:baseline:waves
pnpm test:story:waves
```

Set `WAVES_BASELINE_OUTPUT_DIR` to preserve a particular run outside the default ignored
`engine-wasm/host-sample/test-results/waves-baseline` directory. Relative output paths resolve from
the repository root.

## Window and Keyboard Evidence

Both automated window runs assert:

- no horizontal overflow or clipped shell landmark;
- the handset input controls are inside the initial viewport;
- the same shell/controller/WASM path reaches a committed local deck;
- every enabled native control and disclosure is reachable in a stable 28-control tab sequence (29
  after Back enables);
- Utility Rail, Welcome/Help, Local Example Notes, Developer Tools, and Raw WML disclosures open
  with `Enter`;
- Back enters the first toolbar tab stop when engine history enables it;
- Back, Reload, and Health activate from the keyboard.

At 1024 by 768 the utility rail starts open. At 880 by 640 it starts collapsed, the handset stage
uses the full available width, and Up/Select/Down remain visible without initial vertical scrolling.

[Default 1024 by 768 shell baseline screenshot](evidence/wbp-00-01/default-window-1024x768.png)

[Minimum 880 by 640 shell baseline screenshot](evidence/wbp-00-01/minimum-window-880x640.png)

The screenshots are historical baseline evidence only. `WBP-02` must not treat them as target
goldens.

The unavoidable manual gap is native macOS decoration/menu appearance and platform-drawn focus
styling inside the packaged Tauri window. The webview layout, disclosure behavior, input routing,
and configured window dimensions are automated; native menu wiring remains covered by Tauri Rust
checks.

## Closure Verification

The accepted run completed:

- browser frontend: 181 unit tests, ESLint, TypeScript typecheck, Prettier check, and production Vite
  build;
- executable behavior: all 9 Waves-targeted stories;
- baseline: 20 runs per metric plus default/minimum layout and keyboard audits;
- contracts: Rust/AST regeneration with zero drift;
- Tauri: Rust formatting, Clippy with warnings denied, and 56 non-ignored tests across the host
  library and contract generator (the five external-Kannel smokes remain intentionally ignored);
- documentation: changed-document local-link check, worklist drift, requirement/status drift, Astro
  check, Astro production build, and Git whitespace check.

The first browser keyboard pass directly exposed global `Enter` interception on native controls.
The routing fix now leaves buttons, inputs, selects, summaries, links, and editable host content to
their native behavior while the focused handset viewport continues to route engine keys.

## Phase 1 Integration Seams (Historical)

The `#343` decomposition remains authoritative. `WBP-02` through `WBP-04` landed in `#344`, `#346`,
and `#347` while this integration gate was in progress; `WBP-05` then landed in `#356` before the
final `#348` integration merge. These rows preserve the maintenance seams used by the completed
Phase 1 slices; they are no longer next-work pointers:

| Slice    | Safe leaf seam                                                                         | Integration constraint                                                                                                                                    |
| -------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `WBP-02` | `app/shell/handset-stage-template.ts` plus scoped component styles/tokens              | Do not change 20 logical columns or infer frame, softkey, or hit-region semantics. Root `styles.css` integration remains single-owner.                    |
| `WBP-03` | `app/shell/navigation-toolbar-template.ts` and browser-owned controller callbacks      | Preserve `ShellEventBindingActions`, current navigation ordering, Local/Network behavior, and transport truthfulness.                                     |
| `WBP-04` | new start/help leaf templates and distinct `engine-wasm/examples/source/*` story files | Root-shell insertion, `waves-copy.ts`, and generated example-manifest updates require the integration owner. Tutorial decks use the ordinary engine path. |
| `WBP-05` | landmark/ARIA/focus changes within existing leaf templates and scoped tests            | Reuse native-control keyboard behavior. Do not create a DOM interpretation of WML or add future engine action semantics. The additive `WBP-05A` follow-up owns the single-announcement and rendered-evidence gap found at the Phase 1 checkpoint. |

The root `browser-shell-template.ts`, global `styles.css`, `waves-copy.ts`, and generated example
manifest are high-conflict integration surfaces. The phase slot remains the reserved browser-owned
insertion point; the handset stage retains the current presenter adapter; the developer drawer
remains a top-level sibling rather than utility-rail content.
