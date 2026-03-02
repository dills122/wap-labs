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

This frontend now includes a minimal deck harness UI:

- transport-first URL navigation (`fetch_deck` -> `engine_load_deck_context`)
- deterministic host session-state panel (`idle/loading/loaded/error` + URL/card/focus/error)
- automatic external intent follow loop (`externalNavigationIntent` fetch/load cycle)
- debug-only raw WML textarea path (`Load Raw WML (Debug)`)
- key driving (`up`, `down`, `enter`)
- render output viewport
- runtime snapshot panel

Run from `browser/`:

```bash
pnpm install
pnpm tauri:dev
```
