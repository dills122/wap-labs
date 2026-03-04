# Scripting Steering (Reusable Tasks)

This file defines when and how to add repository scripts.

## When To Script

Create a committed script when a task is:

1. Repeated across contributors or CI.
2. Easy to run incorrectly by hand.
3. Important for quality gates, parity, or release flow.

Do not script:

- single-use migration commands
- personal local convenience aliases

## Design Rules

1. Keep scripts composable and single-purpose.
2. Prefer orchestrating existing commands over custom logic.
3. Fail fast with actionable error messages.
4. Keep output concise and step-oriented (`==> step`, `PASS`, `FAIL`).

## Dependency Strategy

- Prefer existing ecosystem tools first:
  - `cargo`, `pnpm`, `make`, `pre-commit`, `lint-staged`
- Add new tool dependencies only when they reduce maintenance burden.
- Avoid hand-rolled replacements for standard tooling.

## Portability and Shell Choice

- Follow `docs/agents/SHELL_STEERING.md`.
- Local developer-only scripts should prefer Fish for ergonomics.
- Any script intended for CI, Docker, VM, pre-commit/pre-push hooks, or cross-machine reuse should be POSIX-oriented.
- If both local ergonomics and shared portability are needed, use a POSIX canonical script with optional thin Fish wrapper.

## Lifecycle

When adding or changing scripts:

1. Place under `scripts/` (or `scripts/ci/` for CI-focused flows).
2. Add/adjust docs where the script is expected to be used.
3. Remove obsolete task-specific scripts after replacement.
