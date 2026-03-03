# Frontend Shell (Placeholder)

Future Tauri webview UI shell for the Waves desktop host.

Planned responsibilities:

- URL entry and navigation controls
- WAP viewport hosting with softkey/input bindings
- Runtime/debug state panels
- Integration glue to invoke Tauri commands

This is intentionally a placeholder until the first fetch/render vertical slice is implemented.

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
- automatic external intent follow loop (`externalNavigationIntent` fetch/load cycle)
- debug-only raw WML textarea path (`Load Raw WML (Debug)`)
- key driving (`up`, `down`, `enter`)
- render output viewport
- runtime snapshot panel
- deterministic event timeline panel + JSON export path for bug triage artifacts

Developer tools drawer:

- collapsed by default
- toggle via keyboard shortcut: `Ctrl+Shift+D`

Session stack helpers:

- `src/session-history.ts` centralizes host URL/card history behavior used by browser back fallback.

UI component baseline:

- Browser UI uses lightweight native Web Components built with `lit` (no React/Vue/Angular).
- Component registration entrypoint: `src/components/index.ts`.
- First component: `wv-status-panel` (`src/components/status-panel.ts`), used for runtime status/tone rendering.
- Shared primitive: `wv-surface-panel` (`src/components/primitives/surface-panel.ts`) for reusable boxed sections.

App logic modules:

- `src/app/timeline.ts`: timeline state, export building, and validation.
- `src/app/keyboard.ts`: deterministic keyboard-intent mapping.

Local checks:

```bash
pnpm --dir browser/frontend lint
pnpm --dir browser/frontend typecheck
pnpm --dir browser/frontend test
```

Run from `browser/`:

```bash
pnpm install
pnpm tauri:dev
```

Optional startup URL override:

```bash
VITE_WAVES_DEFAULT_URL=wap://127.0.0.1:3000/ pnpm tauri:dev
```
