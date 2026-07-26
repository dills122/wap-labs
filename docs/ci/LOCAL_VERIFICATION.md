# Local Verification Contract

The canonical local verification family is exposed through root `pnpm` scripts and matching Make
targets:

| Profile  | Command                               | Contract                                                                                                                                                                                                                                    |
| -------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fast     | `pnpm verify:fast`                    | Runs the verification-orchestrator tests, whitespace check, and managed-version check.                                                                                                                                                      |
| Change   | `pnpm verify` or `pnpm verify:change` | Runs strict common checks plus every deterministic lane selected by changed paths relative to `origin/main`. Override the base with `WAP_VERIFY_BASE=<ref>` or `--base <ref>`.                                                              |
| Full     | `pnpm verify:full`                    | Runs every deterministic offline lane, including compliance/status drift, graph drift, native and WASM engine checks, contracts, stories, transport, browser host/frontend unit/rendered accessibility, Atlas, marketing, and WML server checks. |
| Extended | `pnpm verify:extended`                | Runs the full profile, then requires the already-running live Kannel/WML stack and runs the browser baseline as a non-blocking stability signal.                                                                                            |

Equivalent Make targets are `verify-fast`, `verify-change`, `verify-full`, and `verify-extended`.
`make ci-local` is retained only as a deprecated compatibility alias. It prints an advisory and
runs `make verify-full`; it is not described as CI-equivalent because GitHub-hosted coverage,
security, OS packaging, and service topology are separate environments.

## Outcome vocabulary

Every known lane is reported with one of these explicit outcomes:

- `PASS`: every required command in the selected lane passed.
- `INTENTIONAL EXCLUSION`: the profile or changed paths deliberately did not select the lane.
- `UNAVAILABLE PREREQUISITE`: a selected required tool or dependency is missing. This makes the
  command fail and includes a remediation hint.
- `ADVISORY`: the lane is intentionally non-blocking, whether its evidence passed or failed.
- `FAILURE`: a selected required command failed. The overall command exits nonzero.

There is no successful skip for a missing prerequisite in a selected required lane. Run
`./scripts/init-refresh.sh` to refresh workspace dependencies. Install the repository Node/pnpm
versions first when absent; use `AUTO_INSTALL_RUST_TOOLS=1 ./scripts/init-refresh.sh` when the
pinned `wasm-pack` or Tauri CLI must be installed.

## Selection and evidence boundaries

The `change` profile combines committed branch changes, staged changes, unstaged changes, and
untracked files. Root verification surfaces such as `package.json`, `pnpm-lock.yaml`, the CI
workflow, or the orchestrator itself select all ordinary deterministic lanes because they can
change every lane's behavior. Layer paths select only their affected commands.

The `full` profile is the ordinary pre-PR command. It deliberately excludes:

- the live Kannel/browser smoke, which requires Docker services and is run by
  `pnpm verify:extended` or the manual `Transport WAP Smoke (Kannel)` workflow;
- scheduled/advisory performance trends beyond the bounded three-run extended baseline;
- fuzz campaigns, which remain explicit time-bounded commands;
- GitHub-hosted dependency, CodeQL, coverage-threshold, release, deployment, and OS-packaging
  jobs.

These exclusions are visible in command output and do not imply conformance or release readiness.
The full compliance wrapper proves that canonical compliance inputs and generated projections are
synchronized; implementation conformance still depends on the direct fixtures and evidence named
by the selected profile.

The extended live-Kannel lane expects the stack to advertise WML 1.3 explicitly at its test
boundary. Start it with `WML_DTD_VERSION=1.3 docker compose up -d --build kannel wml-server`, run
`pnpm verify:extended`, and always finish with `docker compose down`. The transport itself sends the
matching WSP `Encoding-Version: 1.3` request header; neither setting relaxes the production network
policy or the strict WBXML 1.3 decoder.

## Automated contract tests

Run the orchestration tests directly with:

```sh
pnpm verify:test
```

They cover profile selection, path selection, required failure propagation, advisory behavior,
unavailable prerequisites, intentional exclusions, and the CI/compliance-wrapper wiring.
