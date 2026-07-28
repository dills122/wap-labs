# Frontend Shell

Frontend UI shell for the Waves desktop host.

Current responsibilities:

- URL entry and navigation controls
- WAP viewport hosting with softkey/input bindings
- runtime/debug state panels
- local/network mode orchestration
- integration glue to invoke Tauri host commands

The production entry remains `src/main.ts`, which composes the shell with the generated Tauri host
client. `browser-story.html` is a separate test-only entry that uses the same controller, presenter,
and DOM shell with a WASM-backed host client. Only that entry installs
`window.__WAVENAV_STORY_EVIDENCE__`; production builds do not expose the observation bridge.

Current backend harness commands are available in Tauri (`src-tauri/src/lib.rs`) for
frontend integration:

- `engine_load_deck`
- `engine_load_deck_context`
- `engine_render`
- `engine_handle_key`
- `engine_snapshot`

## Local smoke harness

This frontend now includes a browser-style shell with a hidden developer harness:

- transport-first URL navigation (`fetch_deck` -> `engine_load_deck_context`)
- browser chrome with address bar (`Back`, `Reload`, `Go`)
- viewport-first deck rendering and softkey controls (`Up`, `Select`, `Down`)
- global keyboard navigation when not in text-entry fields (`ArrowUp`, `ArrowDown`, `Enter`, `Backspace`)
- hybrid back behavior: engine card-history first, then browser URL history fallback across fetched decks
- deterministic host session-state panel (`idle/loading/loaded/error` + URL/card/focus/error)
- startup boot sequencing states (`booting` -> `shell-ready` -> `engine-ready` -> `deck-ready`)
- first-render viewport skeleton placeholder to avoid blank deck area while initial load is in flight
- runtime mode switch (`Local`/`Network`) with local mode loading bundled offline WML examples directly into the engine
- local example source of truth is `engine-wasm/examples/generated/examples.ts` (mapped into frontend local mode)
- local-only example notes panel (collapsed by default) shows metadata + testing AC for the selected local deck
- local mode captures external form/link intents for inspection instead of fetching them
- focused text-input and single-select edit flows are driven by engine-owned state, not browser shadow state
- automatic external intent follow loop (`externalNavigationIntent` fetch/load cycle)
- debug-only raw WML textarea path (`Load Raw WML (Debug)`)
- key driving (`up`, `down`, `enter`)
- render output viewport
- runtime snapshot panel
- deterministic event timeline panel + JSON export path for bug triage artifacts
- developer-panel serialization is gated behind the drawer being open to avoid hot-path churn
- startup probe, navigation, and host fetch paths have been reduced to avoid unnecessary UI blocking

Developer tools drawer:

- collapsed by default
- toggle via keyboard shortcut: `Ctrl+Shift+D`

Session stack helpers:

- `src/session-history.ts` centralizes host URL/card history behavior used by browser back fallback.

Coordinator modules:

- `src/app/startup-network-probe.ts`
- `src/app/engine-timer-runtime.ts`
- `src/app/focused-control-edit.ts`

UI component baseline:

- Browser UI uses lightweight native Web Components built with `lit` (no React/Vue/Angular).
- Component registration entrypoint: `src/components/index.ts`.
- First component: `wv-status-panel` (`src/components/status-panel.ts`), used for runtime status/tone rendering.
- Shared primitive: `wv-surface-panel` (`src/components/primitives/surface-panel.ts`) for reusable boxed sections.
- WML viewport primitive mapping: `src/components/primitives/wml-render-primitives.ts` groups `RenderList.draw`
  commands by line and renders typed text/link segments with deterministic focus styling.
- Default host presentation follows the `Authentic Core, Modern Console` direction: the native Tauri
  title bar is the application frame, host chrome uses compact system typography and restrained
  platform-like surfaces, and period typography/focus remains scoped to the handset LCD.
- Upstream `win95.css` remains vendored in `src/vendor/win95/` (including required image assets and MIT
  license) as optional reusable material; it is not imported by or authoritative over the default shell.

App logic modules:

- `src/app/timeline.ts`: timeline state, export building, and validation.
- `src/app/keyboard.ts`: deterministic keyboard-intent mapping.
- `src/app/waves-config.ts`: centralized runtime/app constants for Waves frontend.
- `src/app/waves-copy.ts`: centralized copy catalog (i18n-ready shape).

Internationalization baseline:

- User-facing labels/status/error copy is sourced from `src/app/waves-copy.ts`.
- Runtime tuning/constants are sourced from `src/app/waves-config.ts`.

Security baseline:

- Shell mount avoids interpolating runtime startup URL values into HTML strings; URL fields are assigned via
  input element properties after mount (`mountBrowserShell`).

Local checks:

```bash
pnpm --dir browser/frontend lint
pnpm --dir browser/frontend typecheck
pnpm --dir browser/frontend test
pnpm --dir browser/frontend test:coverage
pnpm --dir browser/frontend build
```

Rendered WBP-05A accessibility evidence uses the production-built browser-story entry, real
Chromium, the configured Tauri default/minimum windows at effective 200 percent zoom, full
`axe-core`, explicit 24 by 24 CSS-pixel target geometry, and keyboard focus-style assertions:

```bash
pnpm --dir browser/frontend test:accessibility:rendered
```

Set `WAVES_ACCESSIBILITY_OUTPUT_DIR` to retain JSON and screenshots outside the default ignored
test-results directory. The accepted artifacts and remaining native macOS VoiceOver limitation are
documented in `docs/waves/WAVES_BROWSER_ACCESSIBILITY_EVIDENCE.md`.

Fast ordinary-browser story lane from the repository root:

```bash
cd engine-wasm/engine
wasm-pack build --target web --out-dir ../pkg
cd ../..
pnpm test:story:waves
```

Reproducible WBP-00/WBP-01 startup, navigation, input/render, window, and keyboard baseline:

```bash
WAVES_BASELINE_RUNS=20 pnpm test:baseline:waves
```

The default output is ignored test evidence. Set `WAVES_BASELINE_OUTPUT_DIR` to retain a named run;
relative paths resolve from the repository root. The adopted reference run and scope limitations are
documented in `docs/waves/WAVES_BROWSER_BASELINE.md`.

The lane drives the real Waves controls with softkey clicks and browser keyboard events. Its
primary oracle is the test-only semantic bridge: runtime snapshots, engine traces, host session
state, and render-list text. Playwright screenshots and traces are retained only for failed-flow
debugging. Network-mode stories use an in-memory fixture adapter restricted to canonical
`engine-wasm/examples` decks; they do not exercise native Tauri or Rust transport behavior.

Run from `browser/`:

```bash
pnpm install
pnpm tauri:dev
```

Optional startup URL override:

```bash
VITE_WAVES_DEFAULT_URL=wap://127.0.0.1:3000/ pnpm tauri:dev
```

The Linux-only native UI pilot is separate from the ordinary-browser stories. It uses Selenium
through `tauri-driver` to control the actual Tauri WebView, load `wap://localhost/` through the
native Rust transport and Kannel, navigate to the menu card, assert a visible invalid-URL failure,
and recover by loading the gateway deck again:

```bash
xvfb-run -a make smoke-native-tauri-kannel-ui
```

Failure and success evidence is written under ignored `test-results/native-tauri-kannel.*`
directories unless `NATIVE_E2E_ARTIFACT_DIR` selects a stable CI artifact path.

Current priority follows the main Waves board:

1. Preserve completed additive `WBP-02A` without reopening the WBP-01/WBP-02 history
2. Preserve completed `WBP-00` through additive `WBP-05A`; do not reopen `WBP-05`
3. Keep `WBP-06` and later frame/input work behind their engine contract gate
4. Preserve the current engine and transport contracts throughout browser-owned slices
