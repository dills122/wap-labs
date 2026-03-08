# Versioning and Release Steering

This repository is still pre-alpha. Versioning should communicate progress and release intent, not API stability.

## Current baseline

- Current coordinated repository version: `0.2.0`
- Pre-`1.0.0` policy: breaking changes are still acceptable when they move the MVP forward
- Public GitHub releases are milestone-gated and manual

## Source of truth

The root `VERSION` file is the repository release source of truth.

These files are managed from that version:

- `package.json`
- `browser/package.json`
- `browser/frontend/package.json`
- `browser/src-tauri/Cargo.toml`
- `browser/src-tauri/tauri.conf.json`
- `engine-wasm/engine/Cargo.toml`
- `engine-wasm/host-sample/package.json`
- `marketing-site/package.json`
- `transport-rust/Cargo.toml`
- `wml-server/package.json`
- `wml-server/package-lock.json`

The fuzz harness at `engine-wasm/engine/fuzz/Cargo.toml` is intentionally excluded and remains `0.0.0`.

## Semver policy before 1.0

Use semver syntax, but interpret significance with pre-alpha discipline:

- `0.MINOR.0`: the main signal for meaningful MVP milestones, contract changes, runtime behavior changes, or intentional breaking changes
- `0.MINOR.PATCH`: fixes, docs, internal tooling, test-only changes, or contained behavior corrections that do not justify a new milestone line
- `0.MINOR.0-alpha.N` or `0.MINOR.0-beta.N`: optional pre-release cuts when you want a named checkpoint without treating it as a milestone release

Practical rule:

- If transport, engine, browser contracts, or user-visible runtime behavior move materially, bump the minor version.
- If the change is corrective and localized, bump the patch version.

## Repository version train

Use one coordinated release train across the active stack instead of independent package versioning for now.

Why:

- `transport-rust`, `engine-wasm`, and `browser` still evolve together
- contract-first files move across layers
- the project is explicitly willing to break compatibility during MVP work

Independent package release lines can be introduced later if those surfaces become separately consumable and compatibility expectations harden.

## Local commands

Set a new version across managed files:

```bash
node scripts/set-release-version.mjs 0.2.0
```

Verify all managed files match `VERSION`:

```bash
node scripts/check-release-version.mjs
```

## Release cadence

Version bumps do not automatically create GitHub releases.

Expected flow:

1. Bump the repo version in normal development work when the next target version changes.
2. Keep shipping work on `main` until a milestone is intentionally frozen.
3. Cut a `release/vX.Y.Z` branch only when the milestone is ready to preserve.
4. Publish a GitHub release only from that release branch, and only through the manual milestone workflow.

This keeps internal version progression decoupled from public downloadable releases.

## Naming

- Release branch: `release/vX.Y.Z`
- Git tag: `vX.Y.Z`
- GitHub release title: `vX.Y.Z - <milestone name>`

## Branch immutability

Release branches are historical records, not stabilization branches.

After `release/vX.Y.Z` is created:

- do not push additional commits to it
- do not force-push it
- do not delete it

Use GitHub rulesets to enforce that policy. See `docs/ci/RELEASE_BRANCH_RULESET.md`.
