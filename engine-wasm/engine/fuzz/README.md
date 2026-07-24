# engine-wasm fuzzing

This directory contains cargo-fuzz targets for the WML engine crate.

## Setup

```bash
rustup install nightly
cargo +nightly install cargo-fuzz
```

From `engine-wasm/engine`:

```bash
cargo +nightly fuzz init
```

The initialization step creates expected `fuzz/` scaffolding, but this repo already includes
a curated target and corpus at `engine-wasm/engine/fuzz/`.

## Run the WML deck target

```bash
cd engine-wasm/engine
cargo +nightly fuzz run engine_wml_fuzzer
```

To replay a crash:

```bash
cargo +nightly fuzz run engine_wml_fuzzer fuzz/artifacts/engine_wml_fuzzer/crash-<hash>
```

Curated regression seeds are stored under `fuzz/corpus/engine_wml_fuzzer/` with a
`seed-` prefix (see `.gitignore` at the repo root — the corpus directory is untracked
by default so ad-hoc/mutated corpus entries discovered by running the fuzzer locally
don't get committed, but the `seed-*` naming convention is carved out and tracked
deliberately):

- `seed-nav-cycle-two-card.wml` — a 2-card deck whose `onenterforward` actions target
  each other (and whose `onenterbackward` actions both use `<prev/>`), pinning the
  unbounded-navigation-recursion crash class for permanent fuzz coverage.
- `seed-deep-nesting-near-depth-limit.wml` — a WML fragment nested just past
  `MAX_PARSE_TREE_DEPTH` (128, see `engine-wasm/engine/src/parser/wml_parser/mod.rs`),
  pinning the parse-tree-depth-budget boundary for permanent fuzz coverage.

## Target behavior

- Loads fuzzed input as WML XML with `load_deck_context`.
- Performs render, navigation-key, and timer operations.
- Verifies core runtime paths remain panic-free under invalid or malformed decks.
