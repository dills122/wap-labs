# CI Maintenance Baseline

This is the active maintenance baseline for repository automation. Update it when a workflow's
trigger, required-check contract, cache policy, or measured critical path changes. Archived and
date-stamped documents are outside this baseline by default.

## Evidence snapshot

The 2026-07-30 baseline used the latest 100 public GitHub Actions runs and job/step metadata from
five representative runs for each expensive path. Successful run durations use `run_started_at`
to `updated_at`; failed native-E2E runs are excluded from the workflow median but retained when
examining failure behavior.

| Workflow or job         |            Sample | Median | Observed range | Critical evidence                                                                                     |
| ----------------------- | ----------------: | -----: | -------------: | ----------------------------------------------------------------------------------------------------- |
| Native Tauri Kannel E2E | 4 successful runs | 15m44s |   9m01s-16m08s | Pinned Tauri tools: 5m44s median, 1s-5m54s; pilot: 9m02s median, 7m51s-9m16s                          |
| Transport WAP Smoke     |            5 runs | 10m13s |   9m58s-11m15s | Development image build/start: 6m51s median, 6m48s-7m03s; smoke assertions: 2m07s median, 2m03s-2m37s |
| Security                |           14 runs | 11m33s |  11m07s-11m47s | Image audit build: 7m09s median; Syft/Grype install: 3m02s median; scan: 1m01s median                 |
| CodeQL                  |           15 runs |  7m59s |    7m11s-8m19s | Longest always-triggered PR workflow after unrelated image scans are removed                          |
| CI                      |           16 runs |  3m52s |    1m18s-5m41s | Host-sample job is the full-matrix critical path at about 3m-3m38s                                    |
| Extended Quality        |           15 runs |  1m55s |      20s-2m19s | Path selection already avoids the expensive rendered lane on unrelated PRs                            |

Before this maintenance slice, the repository had 14 checked-in workflows, 34 jobs, 30 checkout
uses, 15 Node setups, 14 pnpm setups, 14 Rust toolchain setups, 13 Rust caches, 6 explicit generic
caches, and 8 artifact uploads. Repetition is mostly a consequence of runner/job isolation; share
immutable dependency stores and build layers, not mutable workspaces or test results.

## Workflow inventory and gate policy

| Workflow                      | Triggers and path scope                                                  | Gate class                                                      | Main dependencies, caches, and artifacts                                               |
| ----------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| CI                            | Every PR, push to `main`, manual; jobs are path-selected on ordinary PRs | Required aggregate: `CI Required Gate`                          | pnpm store, Rust targets, Go caches, pinned `wasm-pack`; story failure artifact        |
| Extended Quality              | PR, `main`, weekly, manual; required lanes path-selected                 | Required aggregate plus scheduled/manual advisory               | pnpm, Rust, `wasm-pack`, Playwright; accessibility and baseline evidence               |
| Security                      | PR, `main`, weekly, manual; image audit path-selected only on PRs        | Four documented required dependency gates; image audit optional | pnpm/Rust/Go caches, exact Syft/Grype binaries, BuildKit image layers, SBOM artifact   |
| CodeQL                        | PR, `main`, weekly, manual                                               | Three required language contexts                                | CodeQL-managed analysis state; no repository artifact                                  |
| Transport WAP Smoke           | Relevant PR paths and manual                                             | Optional path-scoped authentic E2E                              | BuildKit Kannel/WML layers, Rust target, deterministic logs                            |
| Native Tauri Kannel E2E       | Traversed product paths on PRs, weekly, manual                           | Optional pilot                                                  | BuildKit Kannel/WML layers, Rust targets, exact Tauri binaries, UI/service diagnostics |
| OpenTofu Static               | Infrastructure paths on PR/`main`, manual                                | Optional path-scoped static gate                                | Go/OpenTofu provider caches; no cloud state or credentials                             |
| Protected OpenTofu Plan/Apply | Manual only, shared non-cancelling state lock                            | Access-backed operational gates                                 | Encrypted plan artifact; no decrypted state artifact                                   |
| Deploy Pages                  | Relevant pushes to `main`, manual                                        | Deployment only                                                 | pnpm/Rust/`wasm-pack`; deploys `_site` to `gh-pages`                                   |
| Dependabot Auto Merge         | Dependabot PR lifecycle events                                           | Automation only                                                 | Metadata only; no checkout or PR-code execution in write job                           |
| Engine Fuzzing                | Weekly and manual                                                        | Advisory/deep                                                   | Fuzz artifacts retained for 14 days                                                    |
| Release Prepare               | Manual                                                                   | Release operation                                               | Creates immutable release branch with `contents: write`                                |
| Milestone Release             | Manual                                                                   | Release operation                                               | Builds release assets and publishes tag/release with `contents: write`                 |

The required-check names and migration rules remain defined in
[`REQUIRED_CHECKS.md`](REQUIRED_CHECKS.md). Job-level selection is paired with stable aggregate
checks where those aggregates are required. Workflow-level path filters are used only for signals
that must not be configured globally as required contexts.

## Path-to-gate map

| Changed area                                        | Required CI lanes                                           | Additional signals                                                   |
| --------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------- |
| `engine-wasm/engine/**`                             | engine, host sample, browser shell, relevant extended gates | transport smoke, native pilot                                        |
| `engine-wasm/contracts/**`                          | engine, host sample, browser shell                          | transport smoke, native pilot                                        |
| `transport-rust/**` or generated transport contract | transport, browser shell; Atlas evidence where selected     | transport smoke, native pilot                                        |
| `browser/frontend/**`                               | host sample, browser shell, frontend                        | rendered accessibility; native pilot for runtime/package paths       |
| `browser/src-tauri/**`                              | browser shell                                               | transport smoke, native pilot                                        |
| `wml-server/**`                                     | Go server                                                   | transport smoke, native pilot, image security audit                  |
| `docker/kannel/**` or production topology           | repo hygiene remains always-on                              | transport smoke, native pilot, image security audit, OpenTofu static |
| `docs/waves/**` and knowledge graph                 | compliance, Atlas, repo hygiene docs check                  | Pages after merge                                                    |
| other active `docs/**`                              | Atlas, repo hygiene docs check                              | Pages after merge                                                    |
| workflow/config/toolchain/root lockfile             | full ordinary CI through `ci=true`                          | affected workflow self-validation                                    |

The routing fixture at `scripts/tests/fixtures/ci-path-routing.json` locks representative mappings
for engine, transport, browser, gateway, infrastructure, documentation, and shared-contract paths.

## Cache correctness and invalidation

- pnpm: `actions/setup-node` caches only the pnpm content-addressed store and keys it from the
  applicable lockfile. Every job still performs a frozen install; `node_modules` is not cached.
- Rust: `Swatinem/rust-cache` is scoped by named workspace and target directory. Product lockfile
  changes invalidate build artifacts. The two pinned native Tauri executables have a separate
  exact OS, architecture, CLI-version, and driver-version key so product lockfile churn cannot
  force a five-minute reinstall. A dedicated Cargo install root keeps exact crate-version
  provenance beside those cached executables.
- Go: module/build caches remain managed by `actions/setup-go` for product jobs. Syft and Grype are
  cached only as exact pinned executables and are checked against their embedded Go module versions
  after restore before each command is smoke-tested.
- Docker: BuildKit GHA scopes are separated for Kannel development, Kannel production, and the WML
  origin. Dockerfile context, copied source, target, and pinned base digest provide content
  invalidation; development and production tags are loaded explicitly before Compose uses
  `--no-build`.
- Never cache secrets, Compose runtime state, generated test results, coverage results, SBOMs, or
  pass/fail outcomes. Diagnostics remain run-scoped artifacts with bounded retention.

## Implemented priorities

| Priority | Change                                                                | Impact                                                                         | Risk/effort                                                       | Expected steady-state saving                                   |
| -------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------- | -------------------------------------------------------------- |
| P0       | BuildKit layer reuse for Kannel/WML development and production images | Removes the dominant Kannel source rebuild on warm runs                        | Low-medium; content-addressed, target-specific keys               | Up to about 6m51s per smoke and 7m09s per affected image audit |
| P0       | Exact binary caches for Tauri CLI/driver and Syft/Grype               | Decouples tool installs from product dependency churn                          | Low; exact keys plus version checks                               | About 5m44s native and 3m02s image audit on cache hit          |
| P0       | Skip optional image audit on unrelated PRs                            | Removes the 11m33s global PR critical path without deleting the scan           | Low; remains on affected PRs, every `main` push, schedule, manual | About 11m33s elapsed on unrelated PRs                          |
| P1       | PR-only concurrency cancellation                                      | Stops superseded PR runs while preserving every push-to-main and scheduled run | Low                                                               | Variable runner-minute reduction                               |
| P1       | Shared engine-contract routing fix                                    | Prevents host/browser consumers from silently missing contract changes         | Low                                                               | Correctness improvement, not a speed saving                    |
| P1       | Active Markdown file/anchor link check                                | Covers 2,300 active docs deterministically without live network access         | Low; archive/date snapshots explicitly excluded                   | Earlier documentation failures                                 |

Cold-cache runs still compile Kannel and install tools; after timings must be recorded from warm PR
or `main` runs before tightening timeouts. The smoke's readiness probes, WAP/WBXML assertions,
fixtures, native UI path, failure artifacts, and teardown are unchanged.

Local warm-cache validation on the audit worktree built both development images in 0.91 seconds,
started the explicitly loaded Compose images with `--no-build` in 0.24 seconds, and completed all
10 transport/host/render/privacy Kannel smoke assertions in 11.60 seconds. These macOS/arm64
measurements prove layer reuse and preserved behavior, but they are not a substitute for the first
warm `ubuntu-latest` timings. The native UI pilot remains Linux-only because `tauri-driver` does
not support macOS, so its before/after comparison must come from Actions.

## Documentation maintenance contract

Run `pnpm docs:check` for deterministic active Markdown file and anchor validation. It excludes
archive directories, archive-named files, legacy-ticket snapshots, and date-stamped historical
snapshots. `pnpm verify`, `pnpm verify:full`, and Repo Hygiene run the same check. Project Atlas
continues to own schema/metadata and generated-data validation; the compliance wrapper owns ledger,
status, and knowledge-graph drift.

Repository-wide Prettier enforcement is not enabled for Markdown: the measured baseline has 2,292
files that would be reformatted, dominated by generated knowledge-graph content. Adopting that gate
requires a separately reviewed formatting/generated-source policy rather than a maintenance PR with
thousands of unrelated edits. External-link checking is also excluded from the critical PR path;
add a scheduled advisory checker only after defining retries, allowlists, and an ownership policy
for transient failures.

## Security review and residual follow-ups

All checked-in third-party action references are full 40-character commit SHAs. PR validation uses
GitHub-hosted runners, read-only permissions by default, and non-persisted checkout credentials.
There is no `pull_request_target`, unauthenticated comment command, self-hosted PR runner, or
cross-workflow artifact execution path. No externally exploitable GitHub Actions finding was
identified in this audit.

Follow-ups that need separate policy or branch-protection work:

- Whole-repository `actionlint` still reports the pre-existing constant-false disabled engine
  Clippy step; validation ignores only that known baseline diagnostic.
- CodeQL becomes the typical unrelated-PR critical path at about eight minutes. Path-selecting its
  three individually required contexts needs a stable aggregate check and a ruleset migration.
- The native pilot remains optional, but its PR paths now cover every engine, transport, host,
  Kannel, WML, Compose, and lockfile surface that the pilot actually traverses.
- Consider a reusable setup action only after measuring whether reducing YAML duplication offsets
  the extra local-action maintenance surface.
- Measure two warm BuildKit runs and record actual cache-hit timing before lowering Kannel workflow
  timeouts.
