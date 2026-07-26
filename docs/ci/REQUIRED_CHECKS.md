# CI Required Checks Policy

This document defines the intended GitHub ruleset checks for `main`.

For workflow details, see `docs/ci/CI_SETUP.md`. For immutable release-branch governance, see
`docs/ci/RELEASE_BRANCH_RULESET.md`.

## Required check contexts

Configure the active `main` ruleset to require these exact GitHub Actions check names:

- `CI Required Gate`
- `Extended Quality Required Gate`
- `Dependency Review`
- `Rust Advisory Audit`
- `Node Dependency Audit`
- `Analyze (javascript-typescript)`
- `Analyze (rust)`

`CI Required Gate` is the stable aggregate from `.github/workflows/ci.yml`. It evaluates:

- `Detect Changed Areas`
- `Repo Hygiene`
- `Rust Engine`
- `Rust Transport`
- `WaveNav Host Sample Build`
- `Marketing Site Build`
- `Project Atlas Build`
- `Browser Shell Skeleton Checks`
- `WML Server Sanity`
- `Browser Frontend Unit Tests`

For ordinary pull requests, path-filtered jobs may conclude `skipped`; the gate accepts those skips
while failing if an intended job fails or is cancelled. For Dependabot-authored pull requests,
pushes to `main`, and manual CI runs, `full_ci` is true and the gate requires every validation job
to conclude `success`.

The security checks come from `.github/workflows/security.yml`. The CodeQL checks come from the
repository-controlled advanced setup in `.github/workflows/codeql.yml`.

`Extended Quality Required Gate` is the stable aggregate from
`.github/workflows/extended-quality.yml`. For pull requests and pushes to `main`, it selects:

- `Required - Engine Clippy (path-scoped)` for engine and extended-quality workflow changes.
- `Required - Rendered Accessibility (path-scoped)` for browser frontend and its
  engine/contract/build inputs.

The aggregate accepts intentional path-filter skips and fails if any selected gate fails or is
cancelled. The scheduled/manual `Advisory - Browser Stability Baseline (scheduled/manual)` is not
part of this aggregate and must not be configured as a required check.

## Ruleset configuration

In **Settings > Rules > Rulesets > main**:

1. Keep the ruleset active and targeted at the default branch.
2. Keep pull requests required and squash as the allowed merge method.
3. Keep bypass actors empty.
4. Under required status checks, require the seven exact contexts above and select the GitHub
   Actions app as the expected source.
5. Enable the strict/up-to-date option if every pull request must be tested against the latest
   `main` before merge.

The existing required contexts (`Repo Hygiene`, `Rust Engine`, `Rust Transport`, and
`WaveNav Host Sample Build`) are not renamed by this change. Migrate without a deadlock:

1. Let this workflow run once on a pull request so `CI Required Gate` and both `Analyze (...)`
   contexts exist.
2. Add the six new required contexts.
3. Confirm the aggregate and security/CodeQL checks pass on that pull request.
4. Remove the four legacy individual CI contexts from the ruleset. They are redundant once
   `CI Required Gate` is required and would make future path-filter changes harder to manage.

Do not require `Detect Changed Areas` or the individual conditional CI jobs in addition to the
aggregate gate.

## Repository settings required by Dependabot automation

In **Settings > General > Pull Requests**:

- Enable **Allow auto-merge**.
- Keep **Allow squash merging** enabled.

In **Settings > Actions > General > Workflow permissions**:

- Keep the default `GITHUB_TOKEN` permission read-only.
- Do not enable **Send write tokens to workflows from pull requests**.
- PR validation workflows explicitly use read-only permissions and disable persisted checkout
  credentials. Dependency Review does not receive PR write permission because comment summaries
  are not enabled.
- The auto-merge workflow defaults to no permissions, reads Dependabot metadata in a read-only
  job, and requests `contents: write` plus `pull-requests: write` only in the final gated job.
  That final job does not check out or execute pull-request code.
- The setting that lets Actions create and approve pull requests is not required; this workflow
  neither creates nor approves pull requests.

In **Settings > Advanced Security**:

- Enable the dependency graph and Dependabot alerts.
- Enable **Dependabot security updates** if security-fix pull requests are desired. Security
  updates are currently repository-setting controlled; `.github/dependabot.yml` controls version
  updates.
- Use the checked-in `.github/workflows/codeql.yml` advanced setup. Do not enable CodeQL default
  setup for the same languages at the same time.

Auto-merge only queues an eligible pull request. It does not override the ruleset: GitHub merges
only after every required status check and any other ruleset requirement succeeds.

## Manual and deployment workflows

- `Transport WAP Smoke (Kannel)` is manual and must not be required for pull requests.
- `Build and Deploy to gh-pages` is deployment-focused and must not be required for code merges.
- Scheduled/manual fuzzing, browser baseline, and release workflows must not be required
  pull-request checks.

## Maintenance notes

- Treat the check names above as contract surfaces. Update this document and the ruleset whenever
  a required job name changes.
- Validate changes in a live pull request before removing an old required context.
- Do not configure a required workflow that can be skipped at the trigger level by branch or path
  filters; GitHub leaves such checks pending. This repository uses job-level conditions plus the
  always-running aggregate gate instead.
