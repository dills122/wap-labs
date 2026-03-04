# Shell Steering (POSIX-First)

This file defines shell/scripting standards for reusable automation in this repo.

## Core Rules

1. For local developer-only scripts, prefer Fish (`#!/usr/bin/env fish`).
2. For shared/reusable automation (CI, Docker, VM, hooks), prefer POSIX shell (`/bin/sh`).
3. Target Alpine compatibility as the practical portability baseline for shared scripts.
4. If POSIX is not possible, keep shell-specific usage minimal and documented.
5. Prefer existing tooling over custom shell logic.

## Script Placement

- Reusable scripts belong in `scripts/` or `scripts/ci/`.
- One-off local commands should stay in docs/PR notes, not committed scripts.
- Local developer wrappers can use Fish when they are not required by CI/containers/VMs.

## Shebang Policy

- Local dev-only scripts: `#!/usr/bin/env fish`
- Shared scripts (CI/Docker/VM/hook paths): `#!/usr/bin/env sh`
- Use `#!/usr/bin/env bash` only when required by concrete features and document why.

## POSIX Guidance

Prefer:

- `[` ... `]` over `[[` ... `]]`
- `$(...)` over backticks
- `case` for branching on strings
- `command -v` for binary detection

Avoid in POSIX scripts:

- arrays
- process substitution (`<(...)`)
- `pipefail`
- bash-only parameter expansions

## Alpine Compatibility Expectations

- Assume BusyBox userland and `/bin/sh`.
- Avoid GNU-only flags unless guarded.
- Prefer portable flags and simple command forms.

## Reuse Over Reinvention

Before writing a new script, check whether existing tools already solve it:

- package scripts (`pnpm`, `npm`)
- `cargo` subcommands
- `make` targets
- `pre-commit` hooks
- established tools such as `lint-staged`

If a script is still needed:

- keep it small
- keep behavior deterministic
- emit clear PASS/FAIL output

## Quality Checks

- Run `shellcheck` when available.
- Keep scripts readable and dependency-light.
- Document required env vars and prerequisites inline.
