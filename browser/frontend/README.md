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

- WML textarea input
- Transport URL fetch (`fetch_deck`) path
- `Load Deck Context` action
- key driving (`up`, `down`, `enter`)
- render output viewport
- runtime snapshot panel

Run from `browser/`:

```bash
pnpm install
pnpm tauri:dev
```
