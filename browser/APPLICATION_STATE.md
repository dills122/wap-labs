# Waves application state v1

`APP-STATE-01` owns a versioned desktop application-state boundary. The Rust source of truth is
`src-tauri/src/application_state.rs`; generated TypeScript DTOs are emitted to
`contracts/generated/application-state-host.ts` and re-exported by
`contracts/application-state.ts`.

## Persisted envelope

The v1 JSON file contains only these top-level components:

- `schemaVersion`
- `settings`
- `onboarding`
- `favorites`
- `windowState`
- `safeSession`
- `diagnosticPreferences`

Every nested field is an explicit DTO field. Live transport, engine, timeline, response, header,
POST, raw-payload, and runtime objects are outside the schema and are not persisted. Safe network
session recovery is GET-only; credential-bearing URLs, sensitive query keys, and unsupported
schemes are discarded before a write. The safe-session component also owns the recovery-pending
crash marker that distinguishes ordinary startup from recovery.

Native Tauri stores `application-state-v1.json` in the platform application-data directory. It
writes a bounded temporary file in the same directory, flushes it, atomically renames it over the
committed file, and flushes the containing directory on Unix. An interrupted temporary file is
ignored on the next read.

## Startup and recovery

The host returns safe defaults for an absent, corrupt, oversized, unreadable, or future-version
file. Future versions are read-only until the user explicitly resets them, preventing an older
binary from overwriting newer state. Corrupt or unreadable files also block ordinary writes until
an explicit reset or component clear establishes safe v1 state. Stored window bounds are cleared
when their monitor is no longer available, without clearing other components.

The frontend mounts the shell before waiting for application state. Welcome/Help initially uses
its synchronous safe default or the isolated legacy cache, then hydrates from
`ApplicationStateStore` in the background. Window bounds are restored only after that asynchronous
load, and move/resize updates are debounced before they use the same atomic state store.
`waves.showWelcomeOnLaunch` is copied into v1 and removed only after the native save succeeds. A
blocked or failed read never rejects application startup.

The last committed product-owned local example is restored automatically after a marked crash. A
sanitized network GET is presented as a non-modal recovery offer and is never fetched until the
user confirms it. An ordinary launch uses the same policy only when both `safeSessionRestore` and
the `safe-session` start behavior are enabled. POST/request-intent context, sensitive headers,
credential-bearing or sensitive-query URLs, raw debug loads, and oversized targets are never
recovery candidates. A local example removed from the current product fails closed during restore.
An unsafe committed request removes the previous safe session instead of falling back to it.

Every successfully persisted safe commit sets `recoveryPending`. The native Tauri event-loop exit
path clears only that marker with another atomic replacement; a crash cannot reach that path, so
the next launch can distinguish an unclean exit. Dismissing recovery preserves the current rendered
deck and makes that current safe deck the next bounded candidate. Corrupt, unreadable, absent,
future-version, and removed-monitor state remain non-blocking; future state is not overwritten
without an explicit reset.

`ApplicationStateStore` provides `load`, serialized read-modify-write `update`, `save`, `reset`, and
component-specific `clear` operations. Serialized updates prevent settings, Favorites, recovery,
onboarding, and window writers from replacing one another with stale component snapshots. Native
builds use `TauriApplicationStateStore`; deterministic browser tests and stories use
`MemoryApplicationStateStore`.

## Verification

Regenerate and check the Rust-owned DTO, Tauri command, permission, capability, and schema
artifacts with:

```bash
pnpm --dir browser run contracts:check
pnpm --dir browser run tauri:schemas:check
```

Run the state/browser and native host tests with:

```bash
pnpm --dir browser/frontend test
cargo test --manifest-path browser/src-tauri/Cargo.toml --locked
```
