# WaveNav Engine (engine-wasm)

Rust WML runtime engine with dual targets (native + WebAssembly) (MVP).

## Objective

Run the WaveNav WML deck/card runtime in Waves host environments (WASM browser harness and native/Tauri host path) and emit host-consumable structured render output.

## Full Environment Setup

This section is the expected setup for a clean machine.

### 1) System prerequisites

- `git`
- `node` 20.19+ (or 22.12+) and `npm`
- Rust toolchain (`rustup`, `rustc`, `cargo`)
- `wasm-pack`

### 2) Install prerequisites

macOS (Homebrew):

```bash
brew install node rustup-init wasm-pack
rustup-init -y
source "$HOME/.cargo/env"
```

Ubuntu/Debian:

```bash
sudo apt-get update
sudo apt-get install -y curl build-essential pkg-config libssl-dev nodejs npm
curl https://sh.rustup.rs -sSf | sh -s -- -y
source "$HOME/.cargo/env"
cargo install wasm-pack
```

### 3) Verify toolchain

```bash
node --version
npm --version
rustc --version
cargo --version
wasm-pack --version
```

### 4) Build native Rust library

From repo root:

```bash
cd engine-wasm/engine
cargo build
```

### 5) Build WASM package

From repo root:

```bash
cd engine-wasm/engine
wasm-pack build --target web --out-dir ../pkg
```

Expected output directory:

- `engine-wasm/pkg/`

### 6) Run Rust tests

```bash
cd engine-wasm/engine
cargo test
```

### 7) Consume from host app

- Import generated package from `engine-wasm/pkg`
- Use API contract in `engine-wasm/contracts/wml-engine.ts`
- See host loop sample in `engine-wasm/host-sample/renderer.ts`

### 8) Quick local harness (no Electron)

```bash
cd engine-wasm/host-sample
npm install
npm run dev
```

Then open the printed local URL and use the in-browser tester.

## Rust source layout

Engine entry and bindings:
- `engine/src/lib.rs` (crate root and `WmlEngine` state)
- `engine/src/engine_public_api.rs` (public Rust API surface)
- `engine/src/engine_runtime_internal.rs` (internal runtime transitions and navigation/timer behavior)
- `engine/src/engine_script_types.rs` (script outcomes, literals, and classification helpers)
- `engine/src/engine_wasm_bindings.rs` (wasm-bindgen JS boundary wrappers)
- `engine/src/engine_tests.rs` (engine integration-style unit tests)

Parser:
- `engine/src/parser/wml_parser/mod.rs` (public parser entrypoint `parse_wml`)
- `engine/src/parser/wml_parser/actions.rs` (`<do>`, `<onevent>`, task/timer action parsing)
- `engine/src/parser/wml_parser/nodes.rs` (card and inline node parsing)
- `engine/src/parser/wml_parser/xml.rs` (XML tokenize/parse backend via `quick-xml`, normalized element/text tree, text/entity decoding)
- `engine/src/parser/wml_parser/tests.rs` (parser tests)

Core runtime/rendering support:
- `engine/src/runtime/deck.rs`
- `engine/src/runtime/card.rs`
- `engine/src/runtime/node.rs`
- `engine/src/layout/flow_layout.rs`
- `engine/src/nav/focus.rs`
- `engine/src/render/render_list.rs`

Wavescript runtime:
- `engine/src/wavescript/vm.rs` + `engine/src/wavescript/vm_tests.rs`
- `engine/src/wavescript/stdlib/wmlbrowser.rs` + `engine/src/wavescript/stdlib/wmlbrowser_tests.rs`
- `engine/src/wavescript/decoder.rs`, `engine/src/wavescript/value.rs`

Placement guidance:
- Keep parser changes inside `parser/wml_parser/*` by concern (`actions`, `nodes`, `xml`) instead of growing `mod.rs`.
- Keep wasm-only boundary code in `engine_wasm_bindings.rs`; runtime semantics stay in engine/runtime/parser modules.

## MVP support

Supported elements:

- `<wml>`
- `<card id="...">`
- `<p>`
- `<br/>`
- `<a href="...">`
- `#cardId` navigation

Ignored in MVP:

- `<input>`, `<select>`, timers, images, tables

Partially supported (phase W0 baseline):

- Script href execution for registered `.wmlsc` units
- `WMLBrowser` subset: `getVar`, `setVar`, `go`, `prev`
- Deferred post-invocation navigation application (`go`/`prev`)
- Card-entry events: `<onevent type="onenterforward">` and `<onevent type="onenterbackward">` with `<go href>`
- Task-model `prev`/`refresh` support in `<do type="accept">` and `<onevent type="onenterforward|onenterbackward">`
- Immediate timer dispatch for `<timer value="0"/>` with `<onevent type="ontimer">`

## WASM API

- `loadDeck(xml: string)`
- `loadDeckContext(wmlXml: string, baseUrl: string, contentType: string, rawBytesBase64?: string)`
- `render(): RenderList`
- `handleKey(key: 'up' | 'down' | 'enter')`
- `advanceTimeMs(deltaMs: number)` (deterministic timer simulation)
- `navigateToCard(id: string)`

Additional helpers:

- `setViewportCols(cols: number)`
- `activeCardId()`
- `focusedLinkIndex()`
- `baseUrl()`
- `contentType()`
- `externalNavigationIntent()`
- `clearExternalNavigationIntent()`
- `getVar(name: string)`
- `setVar(name: string, value: string)`
- `invokeScriptRef(src: string)` (runtime invocation + post-invocation effect application)
- `invokeScriptRefFunction(src: string, functionName: string)`
- `invokeScriptRefCall(src: string, functionName: string, args: ScriptValueLiteral[])`
- `executeScriptRef(...)` / `executeScriptRefFunction(...)` / `executeScriptRefCall(...)` (raw execution outcome only)

## Native API

Native hosts (including future Tauri backend integration) call `WmlEngine` directly from Rust.
Behavior must stay aligned with the WASM API for:

- deck loading and metadata handling
- navigation and focus transitions
- render output (`RenderList`) ordering and shape
- script execution/invocation outcomes
- trace entry semantics

Type contract:

- `engine-wasm/contracts/wml-engine.ts`
- `docs/wml-engine/requirements-matrix.md`
- `docs/wml-engine/ticket-plan.md`
- `docs/waves/RUNTIME_MARKUP_SPEC_TRACEABILITY.md`
- `docs/waves/CONTRACT_REQUIREMENTS_MAPPING.md`
- `docs/waves/SPEC_TEST_COVERAGE.md`

## Next implementation slice

1. Execute `M1-02`: add parity-critical native/wasm regression coverage for `loadDeckContext`, `handleKey`, `navigateBack`, `render`, and script invocation outcomes.
2. Execute compliance follow-up queue from `docs/wml-engine/work-items.md`: `A5-01`, `A5-02`, `A5-03`, and `B5-01` (additive tickets; no reopening of completed `A*` tickets).
3. Track `M1-03` engine API generator as non-priority design/bootstrap work to reduce manual TypeScript API sync.

## Current checklist (planning/execution)

- [x] Complete Phase A todos in `docs/wml-engine/work-items.md` (`A2-03`, `A3-01`, `A3-02`, `A4-01`, `A4-02`)
- [ ] Keep engine contract and transport/browser mapping synced
- [ ] Expand fixture corpus to cover pending `RQ-RMK-*` and `RQ-WAE-*` groups
- [ ] Add parity-critical native/wasm regression coverage (`M1-02`)
- [x] Harden parser robustness for malformed/edge markup fixtures (`M1-07`)
- [x] Decompose high-churn engine file boundaries without behavior changes (`M1-08`, engine scope)
- [ ] Implement history fidelity follow-up (`A5-01`)
- [ ] Implement inter-card task pipeline conformance follow-up (`A5-02`)
- [ ] Implement WML timer lifecycle follow-up (`A5-03`)
- [ ] Implement input-mask/commit semantics follow-up (`B5-01`)

## Troubleshooting

- Compile error around `href="#..."` in Rust tests: use raw string delimiters `r##"..."##` in fixtures that contain `"#`.
- `wasm-pack: command not found`: install with `cargo install wasm-pack` and reopen shell.
- `No such file or directory: ../pkg`: ensure command is run from `engine-wasm/engine`.
