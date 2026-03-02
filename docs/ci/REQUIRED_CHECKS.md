# CI Required Checks Policy

This document defines the intended required GitHub branch-protection checks for `main`.

## Required workflow checks

Configure branch protection to require these job names from `.github/workflows/ci.yml`:

- `Repo Hygiene`
- `Rust Engine`
- `Rust Transport`
- `WaveNav Host Sample Build`
- `Browser Shell Skeleton Checks`
- `WML Server Sanity`

`Marketing Site Build` may be required or optional depending on whether site changes should block product-layer merges.

## Manual / optional workflows

- `.github/workflows/transport-wap-smoke.yml` is manual (`workflow_dispatch`) and should not be configured as a required PR status check.
- `.github/workflows/pages.yml` is deployment-focused and should not be required for code PR mergeability.

## Maintenance notes

- If job names are changed in workflow YAML, update branch-protection required check names immediately.
- Re-check required checks after CI refactors to avoid stale required statuses blocking merges.
- `Browser Shell Skeleton Checks` includes Rust->TS contract codegen drift validation for `browser/contracts/generated/engine-host.ts` and `browser/contracts/generated/transport-host.ts`.
