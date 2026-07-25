# CI Setup and Operations

This document describes all active GitHub Actions automation for this repository, including validation CI, security scanning, dependency updates, and deployment.

## Quick Reference

- Main validation workflow: `.github/workflows/ci.yml`
- Release branch preparation workflow: `.github/workflows/release-prepare.yml`
- Milestone GitHub release workflow: `.github/workflows/milestone-release.yml`
- Security workflow: `.github/workflows/security.yml`
- Dependabot auto-merge workflow: `.github/workflows/dependabot-auto-merge.yml`
- Code scanning workflow: `.github/workflows/codeql.yml`
- Pages deployment workflow: `.github/workflows/pages.yml`
- Manual transport smoke workflow: `.github/workflows/transport-wap-smoke.yml`
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
- Runs repository-wide hygiene checks and layer-specific Rust/Node checks.
- Reports the stable aggregate check `CI Required Gate`.

Jobs:

- `Repo Hygiene`
  - Node workspace install and lint/type/format checks
  - WaveNav WASM package build
  - Host-sample example manifest generation
  - Browser frontend typecheck contract drift guard
  - Transport contract parity script
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
  - builds the marketing site when selected by path filtering or full CI
- `Project Atlas Build`
  - validates the WAP knowledge graph
  - builds the Project Atlas documentation portal
- `Browser Shell Skeleton Checks`
  - installs Linux Tauri system packages
  - verifies `browser/src-tauri/Cargo.lock` with `cargo metadata --locked`
  - Rust fmt and coverage checks for `browser/src-tauri`
  - Rust->TS contract codegen drift check
- `Browser Frontend Unit Tests`
  - runs the browser frontend unit suite and coverage gate
- `WML Server Sanity`
  - installs `wml-server` deps and runs Node syntax check
- `CI Required Gate`
  - runs with `always()` after all validation jobs
  - fails on failed/cancelled prerequisites
  - permits job-level path-filter skips only for ordinary pull requests
  - requires every validation job to succeed for Dependabot PRs and other full-CI events

Caching:

- pnpm and npm lockfile caches (via `actions/setup-node`)
- Rust build artifact cache (`Swatinem/rust-cache`)
- `wasm-pack` binary cache (`actions/cache`)

### 2) Security (`.github/workflows/security.yml`)

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
  - runs `actions/dependency-review-action`
- `Rust Advisory Audit`
  - runs `cargo audit` in:
    - `engine-wasm/engine`
    - `transport-rust`
    - `browser/src-tauri`
- `Node Dependency Audit`
  - runs `pnpm audit --audit-level high`
  - runs `npm audit --audit-level=high` for `wml-server`

Caching:

- Rust build artifact cache for audit crates
- pnpm cache for workspace audit
- npm cache for `wml-server` audit

### 3) Release Prepare (`.github/workflows/release-prepare.yml`)

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

### 4) Milestone Release (`.github/workflows/milestone-release.yml`)

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

### 5) CodeQL (`.github/workflows/codeql.yml`)

Purpose:

- Repository-controlled advanced CodeQL scanning (SAST) for Rust and JavaScript/TypeScript.

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
- Rust uses `none`, the only CodeQL build mode supported for Rust. CodeQL extracts the Rust
  source directly, so this workflow does not install Tauri system dependencies or run manual
  Cargo builds. Compilation remains covered by the main CI workflow.

All CodeQL actions are pinned to immutable commit SHAs. The repository must leave CodeQL default
setup disabled while this advanced workflow manages the same languages.

Config:

- `.github/codeql/codeql-config.yml`
  - includes core source paths: `browser`, `engine-wasm`, `transport-rust`, `wml-server`, `scripts`
  - excludes generated/build paths such as `target`, `dist`, `node_modules`, `engine-wasm/pkg`, and generated browser contracts

### 6) Deploy Pages (`.github/workflows/pages.yml`)

Purpose:

- Build and publish static artifacts to `gh-pages`.

Triggers:

- `push` to `main` when paths change:
  - `marketing-site/**`
  - `engine-wasm/host-sample/**`
  - `.github/workflows/pages.yml`
- `workflow_dispatch`

Behavior:

- builds marketing site and host-sample
- assembles combined `_site` artifact
- deploys to `gh-pages` branch with `peaceiris/actions-gh-pages`

### 7) Transport WAP Smoke (`.github/workflows/transport-wap-smoke.yml`)

Purpose:

- On-demand end-to-end smoke for Kannel + WML stack integration.

Triggers:

- `workflow_dispatch` only

Behavior:

- starts Docker services (`kannel`, `wml-server`)
- runs `make smoke-transport-wap`
- executes both:
  - transport-rust ignored Kannel smoke tests
  - browser host ignored Kannel smoke test
- dumps service logs on failure
- always tears down stack

## Dependency Update Automation

File:

- `.github/dependabot.yml`
- `.github/workflows/dependabot-auto-merge.yml`

Configured ecosystems:

- `github-actions` (root)
- npm:
  - root workspace (`/`)
  - `/marketing-site`
  - `/wml-server`
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
  declared workspaces share `pnpm-lock.yaml`; marketing-site, wml-server, and every Cargo lockfile
  remain independent.

Auto-merge behavior:

- The workflow runs on `pull_request`, not `pull_request_target`.
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
- On Dependabot rebases/synchronizations, the workflow re-runs and re-enables auto-merge for the updated head.

Lockfile ownership:

- Dependabot owns manifest and lockfile changes for its configured ecosystem.
- The former write-back workflow was removed. CI never checks out PR code under
  `pull_request_target`, broadly refreshes unrelated lockfiles, or commits generated lockfile
  changes.
- pnpm frozen installs, `npm ci`, and `cargo metadata --locked` verify that Dependabot supplied a
  usable lockfile without mutating the PR.

Repository setting prerequisites are documented in `docs/ci/REQUIRED_CHECKS.md`.

## Branch Protection Guidance

Use `docs/ci/REQUIRED_CHECKS.md` as the source of truth for required checks on `main`.

For immutable release branches, use `docs/ci/RELEASE_BRANCH_RULESET.md` as the source of truth for GitHub ruleset configuration.

At minimum, require:

- `CI Required Gate` from `ci.yml`
- Security jobs from `security.yml`
- CodeQL matrix checks from `codeql.yml`

Do not require:

- `Transport WAP Smoke` (manual)
- `Deploy Pages` (deployment workflow)

## Common Failure Modes

- Tauri/GTK pkg-config errors (`gio-2.0`, `glib-2.0`, `gobject-2.0`)
  - Ensure Linux dependencies are installed in the workflow before Rust build/check steps.
- Tauri frontend dist missing during Rust compile
  - Ensure `browser/frontend/dist/index.html` placeholder exists for CI/build-time config.
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
