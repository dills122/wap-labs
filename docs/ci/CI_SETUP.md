# CI Setup and Operations

This document describes all active GitHub Actions automation for this repository, including validation CI, security scanning, dependency updates, and deployment.

## Quick Reference

- Main validation workflow: `.github/workflows/ci.yml`
- Secret-free network-preview infrastructure validation: `.github/workflows/opentofu.yml`
- Extended deterministic quality workflow: `.github/workflows/extended-quality.yml`
- Release branch preparation workflow: `.github/workflows/release-prepare.yml`
- Milestone GitHub release workflow: `.github/workflows/milestone-release.yml`
- Security workflow: `.github/workflows/security.yml`
- Dependabot auto-merge workflow: `.github/workflows/dependabot-auto-merge.yml`
- Code scanning workflow: `.github/workflows/codeql.yml`
- Pages deployment workflow: `.github/workflows/pages.yml`
- Path-scoped PR/manual transport smoke workflow: `.github/workflows/transport-wap-smoke.yml`
- Self-validating PR/scheduled/manual native Tauri/Kannel UI pilot: `.github/workflows/native-tauri-kannel-e2e.yml`
- Canonical local verification contract: `docs/ci/LOCAL_VERIFICATION.md`
- Dependency updates: `.github/dependabot.yml`
- Branch protection check policy: `docs/ci/REQUIRED_CHECKS.md`

## Workflows

### 1) CI (`.github/workflows/ci.yml`)

Purpose:

- Primary merge gate for product code quality and parity checks.

Triggers:

- `pull_request`
- `push` to `main`
- `workflow_dispatch`

Core behavior:

- Uses path filtering (`Detect Changed Areas`) to skip unrelated layer jobs on PRs.
- Derives `full_ci` from the event and pull-request author.
- Forces the complete validation matrix for Dependabot-authored PRs, pushes to `main`, and manual
  runs while preserving path filtering for ordinary PRs.
- Requires a Dependabot-authored PR to use a repository-owned head branch before granting it
  full-matrix treatment.
- Runs repository-wide hygiene checks and layer-specific Rust/Node checks.
- Runs the complete compliance wrapper, including active requirement/status drift, when
  compliance inputs or CI surfaces change and on full-matrix events.
- Reports the stable aggregate check `CI Required Gate`.
- Keeps PR validation read-only, does not persist checkout credentials for later build steps, and
  does not expose a write token or repository secrets to checked-out PR code.
- Sets explicit job timeouts so a hung build or dependency cannot consume the default six-hour
  GitHub-hosted runner window.

Jobs:

- `Repo Hygiene`
  - Node workspace install and lint/type/format checks
  - WaveNav WASM package build
  - Host-sample example manifest generation
  - Browser frontend typecheck contract drift guard
  - Transport contract parity script
  - canonical verification selection/failure-propagation tests
- `WAP Compliance and Status Drift`
  - path-selected for active compliance docs, canonical manifests/generators, graph inputs, and
    compliance/status scripts
  - runs `pnpm wap-compliance:check`, including effective-spec determinism, selected-clause and
    transport ledgers, active fact derivation, requirement/status drift, and graph drift
  - participates in `CI Required Gate`; a selected failure cannot be accepted as a path skip
- `Rust Engine`
  - verifies the engine and engine-fuzz lockfiles with `cargo metadata --locked`
  - `cargo fmt --check`
  - coverage gate with `cargo llvm-cov`
- `Rust Transport`
  - verifies `transport-rust/Cargo.lock` with `cargo metadata --locked`
  - exercises the pinned built-in WML 1.3 WBXML decoder
  - `cargo fmt --check`
  - `cargo clippy -- -D warnings`
  - coverage gate with `cargo llvm-cov`
- `WaveNav Host Sample Build`
  - builds WASM package and host-sample app
  - validates executable-flow schema and exact ticket/spec mappings
  - installs Playwright Chromium and runs all story-driven WASM host flows
  - uploads screenshots, traces, and structured evidence when a story fails
  - host-sample typecheck/lint/format checks
- `Marketing Site Build`
  - installs with lifecycle scripts disabled
  - builds the marketing site when selected by path filtering or full CI
- `Project Atlas Build`
  - validates the WAP knowledge graph
  - validates transport conformance evidence references against current source and tests
  - builds the Project Atlas documentation portal
- `Browser Shell Skeleton Checks`
  - installs Linux Tauri system packages
  - verifies `browser/src-tauri/Cargo.lock` with `cargo metadata --locked`
  - Rust fmt and coverage checks for `browser/src-tauri`
  - Rust->TS contract codegen drift check
- `Browser Frontend Unit Tests`
  - runs the browser frontend unit suite and coverage gate
- `WML Server Sanity`
  - installs Go from the module directive
  - runs `gofmt` drift, `go vet ./...`, and race-enabled Go tests
  - builds the static non-root container and validates the Compose model
- `CI Required Gate`
  - runs with `always()` after all validation jobs
  - fails on failed/cancelled prerequisites
  - permits job-level path-filter skips only for ordinary pull requests
  - requires every validation job to succeed for Dependabot PRs and other full-CI events

Local `fast`, `change`, `full`, and `extended` profiles are documented separately in
`docs/ci/LOCAL_VERIFICATION.md`. They do not claim to reproduce GitHub-hosted coverage, security,
or OS-specific jobs.

### OpenTofu Static Validation (`.github/workflows/opentofu.yml`)

Purpose:

- Validate the resource-free `INF-101` network-preview scaffold without cloud credentials or a
  remote backend.

Triggers:

- path-scoped `pull_request` and pushes to `main`
- `workflow_dispatch`

Behavior:

- installs OpenTofu from `infra/network-preview/.opentofu-version` through a full-SHA-pinned
  setup action;
- checks recursive formatting;
- initializes the preview root with `-backend=false -lockfile=readonly`;
- validates the root with a non-secret, validation-only encryption sentinel;
- regenerates the `linux_amd64`, `darwin_arm64`, and `darwin_amd64` provider checksums and fails
  on lock-file drift;
- checks every network-preview CI helper's POSIX syntax, runs `shellcheck`, and exercises the
  protected workflow contracts without credentials;
- has only `contents: read`, does not persist checkout credentials, and receives no repository or
  environment secrets.

This workflow does not contact R2 or DigitalOcean, produce a speculative plan, create a GitHub
environment, or run `tofu apply`. It also proves locally that enforced plan encryption produces an
opaque saved plan and runs contract tests over the protected workflow definitions. Live R2
locking and provider planning remain blocked by `PRE-001`/`PRE-003` and require separately
protected environments before activation. Do not make this path-triggered job a global required
context; ordinary PRs outside its paths do not create it.

### OpenTofu Protected Plan and Apply

`.github/workflows/opentofu-protected-plan.yml` and
`.github/workflows/opentofu-protected-apply.yml` are manual-only access-backed workflows. They:

- run only from `main` through the `network-preview-plan` and `network-preview-apply`
  environments;
- share `opentofu-network-preview-state` concurrency with `cancel-in-progress: false`;
- generate an encrypted plan whose SHA-256 is bound into its GitHub artifact name alongside the
  source commit and run attempt;
- let apply accept only the plan run ID and exact artifact ID, then verify the repository,
  workflow identity/ref, successful conclusion, source commit, artifact ownership, and digest via
  GitHub's read-only Actions API;
- reject a reviewed plan when `main` advanced, and apply the downloaded encrypted plan without
  generating a replacement;
- create and verify an encrypted pre-apply R2 recovery object, reconfirm source/lock/copy state
  immediately before apply, and retain at most the five newest verified recovery objects only
  after successful apply and current-state verification.

All external actions are full-SHA pinned. Decrypted plan/state content is neither logged nor
retained; workflow summaries contain only sanitized action/address/count data and provenance
digests. These workflow definitions must not be enabled or run until `PRE-001`/`PRE-003`, protected
environment review, real credential scope, and exact operation authority are complete.

Caching:

- pnpm lockfile caches (via `actions/setup-node`)
- Go build and module caches (via `actions/setup-go`)
- Rust build artifact cache (`Swatinem/rust-cache`)
- `wasm-pack` binary cache (`actions/cache`)

### 2) Extended Quality (`.github/workflows/extended-quality.yml`)

Purpose:

- Required, path-scoped engine lint and rendered browser accessibility gates.
- Scheduled and manually dispatchable advisory browser stability measurements.

Triggers and classification:

- `pull_request` and `push` to `main`
  - `Required - Engine Clippy (path-scoped)` runs for engine or workflow changes and enforces
    `cargo clippy --all-targets --all-features -- -D warnings` without warning suppression.
  - `Required - Rendered Accessibility (path-scoped)` runs for browser frontend and its
    engine/contract/build inputs. It preserves the deterministic unit accessibility test and adds
    the production-built Chromium/axe rendered check.
  - `Extended Quality Required Gate` is the stable required aggregate. It succeeds when selected
    jobs pass and permits only intentional path-filter skips.
- Weekly schedule (`17 7 * * 0`) and `workflow_dispatch`
  - `Advisory - Browser Stability Baseline (scheduled/manual)` exercises startup, navigation,
    input/render, layout, and keyboard behavior with `WAVES_BASELINE_RUNS` (20 by default; manual
    runs accept 5 through 100).
  - Deterministic behavior assertions can fail the advisory run. Recorded latency samples have no
    pass/fail threshold until the project accepts a stable reference, so timing variability never
    blocks a pull request.

Prerequisites and artifacts:

- Uses the repository Node 22 and pnpm lockfile, stable Rust, pinned `wasm-pack` 0.13.1, and the
  Playwright-lockfile Chromium version.
- Rendered accessibility failures upload JSON, screenshots, and Playwright traces when a page was
  available. The dedicated failure artifact is retained for 14 days.
- Baseline runs always attempt to upload the JSON and screenshots produced before completion for
  14 days. These runtime outputs remain ignored local/generated evidence and are not committed.
- All actions are pinned to full commit SHAs, permissions are read-only, and checkout credentials
  are not persisted.

### 3) Security (`.github/workflows/security.yml`)

Purpose:

- Dependency risk checks and advisory scanning.

Triggers:

- `pull_request`
- `push` to `main`
- weekly cron (`27 6 * * 1`)
- `workflow_dispatch`

Jobs:

- `Dependency Review`
  - PR-only
  - read-only; it does not post PR comments
  - runs `actions/dependency-review-action`
- `Rust Advisory Audit`
  - runs `cargo audit` in:
    - `engine-wasm/engine`
    - `transport-rust`
    - `browser/src-tauri`
- `Node Dependency Audit`
  - runs `pnpm audit --audit-level high`
- `Go Vulnerability Audit`
  - runs pinned `govulncheck` against the WML origin and selected Go standard library

Caching:

- Rust build artifact cache for audit crates
- pnpm cache for workspace audit
- Go build and module cache for the WML origin audit

### 4) Release Prepare (`.github/workflows/release-prepare.yml`)

Purpose:

- Manually create a frozen `release/vX.Y.Z` branch without publishing a GitHub release.

Triggers:

- `workflow_dispatch`

Behavior:

- checks out a chosen source ref (default `main`)
- syncs all managed manifest versions from the requested semver
- verifies version consistency
- commits the release version bump only if needed
- pushes a new `release/vX.Y.Z` branch and fails if it already exists

### 5) Milestone Release (`.github/workflows/milestone-release.yml`)

Purpose:

- Manually publish a milestone-tagged GitHub release from an existing release branch.

Triggers:

- `workflow_dispatch`

Behavior:

- checks out `release/vX.Y.Z` by default
- verifies managed versions still match `VERSION`
- builds the static site and simulator bundle
- creates an annotated `vX.Y.Z` tag
- publishes a GitHub release with downloadable source and site-bundle assets

### 6) CodeQL (`.github/workflows/codeql.yml`)

Purpose:

- Repository-controlled advanced CodeQL scanning (SAST) for Rust, Go, and JavaScript/TypeScript.

Triggers:

- `pull_request` targeting `main`
- `push` to `main`
- weekly cron (`43 5 * * 2`)
- `workflow_dispatch`

Matrix checks:

- `Analyze (javascript-typescript)`
- `Analyze (rust)`

Build modes:

- JavaScript/TypeScript uses `none`.
- Go uses `none`.
- Rust uses `none`, the only CodeQL build mode supported for Rust. CodeQL extracts the Rust
  source directly, so this workflow does not install Tauri system dependencies or run manual
  Cargo builds. Compilation remains covered by the main CI workflow.

All CodeQL actions are pinned to immutable commit SHAs. The repository must leave CodeQL default
setup disabled while this advanced workflow manages the same languages.

Config:

- `.github/codeql/codeql-config.yml`
  - includes core source paths: `browser`, `engine-wasm`, `transport-rust`, `wml-server`, `scripts`
  - excludes generated/build paths such as `target`, `dist`, `node_modules`, `engine-wasm/pkg`, and generated browser contracts

### 7) Deploy Pages (`.github/workflows/pages.yml`)

Purpose:

- Build and publish static artifacts to `gh-pages`.

Triggers:

- `push` to `main` when paths change:
  - `marketing-site/**`
  - `docs-portal/**`
  - `docs/**`
  - `spec-processing/source-manifests/**`
  - `engine-wasm/host-sample/**`
  - `pnpm-lock.yaml`
  - `pnpm-workspace.yaml`
  - `.github/workflows/pages.yml`
- `workflow_dispatch`

Behavior:

- builds the marketing site, WaveNav simulator, and Project Atlas
- assembles the three applications under `/`, `/simulator/`, and `/atlas/`
- deploys to `gh-pages` branch with `peaceiris/actions-gh-pages`

### 8) Transport WAP Smoke (`.github/workflows/transport-wap-smoke.yml`)

Purpose:

- Path-scoped pull-request and on-demand smoke for Kannel + WML stack integration.

Triggers:

- `pull_request` targeting `main` when gateway/Kannel, transport, engine contracts/runtime,
  browser host/contracts, WML server, smoke runner, or its workflow changes
- `workflow_dispatch`

Behavior:

- starts Docker services (`kannel`, `wml-server`)
- serves WML 1.3 through an explicit test-only DTD setting; the server default remains WML 1.1
- sends `Encoding-Version: 1.3` as the WSP-defined short-integer version-value, and uses the
  locally patched Kannel connectionless path to decode and carry that request negotiation into WML
  compilation
- runs `make smoke-transport-wap`
- executes:
  - transport-rust ignored Kannel smoke tests
  - browser host ignored Kannel smoke test
  - browser engine/render ignored Kannel smoke test
- dumps service logs on failure
- uploads the deterministic smoke logs for every run with 14-day retention
- always tears down stack

This is a relevant-PR signal, but it is not a globally required context because workflow-level
path filters mean the check correctly does not exist on unrelated pull requests.

### 8) Native Tauri Kannel E2E (`.github/workflows/native-tauri-kannel-e2e.yml`)

Purpose:

- Non-optimistic Linux pilot for the complete visible path from production Tauri frontend controls
  through generated IPC, the native Rust host/engine, `transport-rust`, and local Kannel.

Triggers:

- `pull_request` only when the pilot workflow, runner, Selenium client, package declaration, or
  Make target itself changes; this bootstraps executable validation without claiming general
  browser/transport PR coverage
- weekly schedule (`17 5 * * 1`)
- `workflow_dispatch`

Behavior:

- installs the Linux WebKit WebDriver and Xvfb dependencies documented by Tauri
- installs pinned `tauri-cli` 2.10.0 and `tauri-driver` 2.0.6
- builds the production frontend and an unbundled debug Tauri application
- starts Kannel and the WML server, then opts into local/private access only with the existing
  `WAVES_FETCH_DESTINATION_POLICY=allow-private` host boundary
- pins `wap-net-core` and disables gateway fallback
- serves WML 1.3 through the same explicit WML-server test boundary and requires Kannel to emit
  the negotiated WBXML 1.3 envelope accepted by the pinned decoder
- uses Selenium to click the real Go and Select controls, assert the gateway-served home/menu UI,
  assert a visible invalid-URL failure, and recover with another real gateway load
- uploads fixed-name screenshots, page source, structured evidence, driver logs, environment
  versions, service logs, and pre/post-teardown state with 21-day retention
- closes the WebDriver session, terminates the isolated GUI process group, and always tears down
  Docker services

The pilot is intentionally not a required or product-change pull-request check yet. Its narrow PR
filter validates the pilot implementation itself. Widen it additively to relevant product paths
only after all criteria in the active E2E readiness scorecard are met.

## Dependency Update Automation

File:

- `.github/dependabot.yml`
- `.github/workflows/dependabot-auto-merge.yml`

Configured ecosystems:

- `github-actions` (root)
- npm:
  - root workspace (`/`)
  - `/marketing-site`
- Go modules:
  - `/wml-server`
- OpenTofu/Terraform providers:
  - `/infra/network-preview/environments/preview`
- cargo:
  - `/engine-wasm/engine`
  - `/engine-wasm/engine/fuzz`
  - `/transport-rust`
  - `/browser/src-tauri`

Grouping and cadence:

- Patch and minor version updates are grouped only within one package ecosystem and one configured
  directory/lockfile boundary.
- Major version updates do not match a group and therefore remain individual pull requests for
  manual review.
- Security updates do not match the version-update groups and remain individual for focused
  review.
- Checks run weekly at deterministic UTC times: GitHub Actions on Monday, Node ecosystems on
  Tuesday, and Rust ecosystems on Wednesday.
- Node and Cargo releases use a three-day patch, seven-day minor, and fourteen-day major
  cooldown. GitHub Actions uses a seven-day default cooldown because that ecosystem does not
  support SemVer-specific cooldown keys.
  Cooldowns do not delay security updates.
- Open-PR limits are set per ecosystem/directory to prevent an update burst from flooding the
  review queue.
- No multi-ecosystem groups are used. The root pnpm workspace is grouped together because its
  declared workspaces share `pnpm-lock.yaml`; marketing-site, the WML Go module, and every Cargo
  lockfile remain independent.

Auto-merge behavior:

- The workflow runs on `pull_request`, not `pull_request_target`.
- The workflow defaults to no token permissions and first evaluates repository-owned Dependabot
  PR metadata in a read-only job.
- `dependabot/fetch-metadata` is pinned to a full commit SHA and verifies that the PR and commits
  are Dependabot-owned.
- Only patch and minor updates have auto-merge enabled. The metadata action reports the highest
  semver change in grouped PRs, so a group cannot hide a major update.
- Major updates and updates without recognized patch/minor metadata require manual review.
- Security updates follow the same semver auto-merge rule when the repository setting for
  Dependabot security updates is enabled; unlike routine version updates, they remain ungrouped
  and are not delayed by cooldowns.
- The workflow uses `gh pr merge --auto --squash`, so GitHub queues the merge and waits for every
  required ruleset check. It does not merge around CI, security, CodeQL, review, or signature
  requirements.
- Only the final, policy-approved job receives `contents: write` and `pull-requests: write`. That
  job does not check out or execute PR code, and the write token is not passed to the metadata
  action.
- On Dependabot rebases/synchronizations, the workflow re-runs and re-enables auto-merge for the updated head.

Lockfile ownership:

- Dependabot owns manifest and lockfile changes for its configured ecosystem.
- The former write-back workflow was removed. CI never checks out PR code under
  `pull_request_target`, broadly refreshes unrelated lockfiles, or commits generated lockfile
  changes.
- pnpm frozen installs, Go module verification, and `cargo metadata --locked` verify that
  Dependabot supplied usable dependency metadata without mutating the PR.
- Node package installation uses `--ignore-scripts` in PR CI. Later build and test commands still
  execute the checked-in project scripts and dependency binaries required for validation, but
  only with read-only job permissions and without persisted checkout credentials.

Repository setting prerequisites are documented in `docs/ci/REQUIRED_CHECKS.md`.

## Branch Protection Guidance

Use `docs/ci/REQUIRED_CHECKS.md` as the source of truth for required checks on `main`.

For immutable release branches, use `docs/ci/RELEASE_BRANCH_RULESET.md` as the source of truth for GitHub ruleset configuration.

At minimum, require:

- `CI Required Gate` from `ci.yml`
- `Extended Quality Required Gate` from `extended-quality.yml`
- Security jobs from `security.yml`
- CodeQL matrix checks from `codeql.yml`

Do not require:

- `Transport WAP Smoke` globally (it is a path-scoped PR signal and does not run for unrelated PRs)
- `Native Tauri Kannel E2E` until its documented pilot promotion criteria are met
- `OpenTofu Static Validation` globally (it is path-scoped and otherwise absent)
- `Deploy Pages` (deployment workflow)

## Common Failure Modes

- Tauri/GTK pkg-config errors (`gio-2.0`, `glib-2.0`, `gobject-2.0`)
  - Ensure Linux dependencies are installed in the workflow before Rust build/check steps.
- Tauri frontend dist missing during Rust compile
  - `pnpm --dir browser run contracts:codegen` and `contracts:check` create the minimal
    `browser/frontend/dist/index.html` automatically. Direct Tauri compile/coverage commands still
    need a real frontend build or an explicit placeholder for the compile-time config.
- Lockfile/cache mismatches
  - Confirm the correct lockfile path is used for `actions/setup-node` cache keys.
- Branch protection check name mismatch
  - If a workflow job name changes, update `docs/ci/REQUIRED_CHECKS.md` and branch protection settings immediately.
- Release branch remains mutable
  - Confirm the `release/v*` ruleset blocks updates and deletions after branch creation.
- Version drift failure in CI
  - Run `node scripts/set-release-version.mjs <semver>` and then `node scripts/check-release-version.mjs`.

## Maintenance Checklist

When changing CI:

1. Update workflow YAML.
2. Update `docs/ci/REQUIRED_CHECKS.md` if check names change or required policy changes.
3. Update `docs/ci/RELEASE_BRANCH_RULESET.md` when release branch governance changes.
4. Update `docs/releases/VERSIONING.md` when versioning semantics or release cadence changes.
5. Update this document when behavior/triggers/caches change.
6. Validate with at least one PR run after merge.
