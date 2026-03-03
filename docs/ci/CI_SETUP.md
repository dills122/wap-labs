# CI Setup and Operations

This document describes all active GitHub Actions automation for this repository, including validation CI, security scanning, dependency updates, and deployment.

## Quick Reference

- Main validation workflow: `.github/workflows/ci.yml`
- Security workflow: `.github/workflows/security.yml`
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
- Runs repository-wide hygiene checks and layer-specific Rust/Node checks.

Jobs:
- `Repo Hygiene`
  - Node workspace install and lint/type/format checks
  - WaveNav WASM package build
  - Host-sample example manifest generation
  - Browser frontend typecheck contract drift guard
  - Transport contract parity script
- `Rust Engine`
  - `cargo fmt --check`
  - coverage gate with `cargo llvm-cov`
- `Rust Transport`
  - installs `libwbxml` runtime packages
  - `cargo fmt --check`
  - `cargo clippy -- -D warnings`
  - coverage gate with `cargo llvm-cov`
- `WaveNav Host Sample Build`
  - builds WASM package and host-sample app
  - host-sample typecheck/lint/format checks
- `Marketing Site Build`
  - builds marketing site (required/optional per branch-protection policy)
- `Browser Shell Skeleton Checks`
  - installs Linux Tauri system packages
  - Rust fmt and coverage checks for `browser/src-tauri`
  - Rust->TS contract codegen drift check
- `WML Server Sanity`
  - installs `wml-server` deps and runs Node syntax check

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

### 3) CodeQL (`.github/workflows/codeql.yml`)

Purpose:
- GitHub code scanning (SAST) for Rust and JavaScript/TypeScript.

Triggers:
- `pull_request` targeting `main`
- `push` to `main`
- weekly cron (`43 5 * * 2`)
- `workflow_dispatch`

Matrix checks:
- `Analyze (javascript-typescript)`
- `Analyze (rust)`

Rust-specific setup:
- installs Tauri Linux system dependencies (GTK/GLib/WebKit)
- creates `browser/frontend/dist/index.html` placeholder for Tauri compile-time config
- performs `cargo check` for:
  - `engine-wasm/engine`
  - `transport-rust`
  - `browser/src-tauri`

Config:
- `.github/codeql/codeql-config.yml`
  - includes core source paths: `browser`, `engine-wasm`, `transport-rust`, `wml-server`, `scripts`
  - excludes generated/build paths such as `target`, `dist`, `node_modules`, `engine-wasm/pkg`, and generated browser contracts

Caching:
- Rust build artifact cache for the Rust matrix leg

### 4) Deploy Pages (`.github/workflows/pages.yml`)

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

### 5) Transport WAP Smoke (`.github/workflows/transport-wap-smoke.yml`)

Purpose:
- On-demand end-to-end smoke for Kannel + WML stack integration.

Triggers:
- `workflow_dispatch` only

Behavior:
- starts Docker services (`kannel`, `wml-server`)
- runs `make smoke-transport-wap`
- dumps service logs on failure
- always tears down stack

## Dependency Update Automation

File:
- `.github/dependabot.yml`

Configured ecosystems:
- `github-actions` (root)
- npm:
  - root workspace (`/`)
  - `/marketing-site`
  - `/wml-server`
- cargo:
  - `/engine-wasm/engine`
  - `/transport-rust`
  - `/browser/src-tauri`

Cadence:
- weekly for all ecosystems

## Branch Protection Guidance

Use `docs/ci/REQUIRED_CHECKS.md` as the source of truth for required checks on `main`.

At minimum, require:
- Main CI check jobs from `ci.yml`
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

## Maintenance Checklist

When changing CI:
1. Update workflow YAML.
2. Update `docs/ci/REQUIRED_CHECKS.md` if check names change or required policy changes.
3. Update this document when behavior/triggers/caches change.
4. Validate with at least one PR run after merge.
