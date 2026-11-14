# Ruflo and Codex pilot

Status: local, opt-in coordination pilot, not a repository-wide standard.

## Setup

Run `python3 scripts/ruflo/bootstrap.py` with Python 3.11 or newer and the project Node 26
toolchain and npm on `PATH`.
The bootstrap installs the exact Ruflo 3.77.1 dependency graph from the checked-in lockfile with
lifecycle scripts disabled. It adds a project-scoped Codex MCP entry and local Git exclusions; it
refuses to overwrite an existing, different Ruflo entry. Existing project or global agent steering
and unrelated MCP settings are not replaced. Reopen Codex to load the project configuration.

The local MCP server runs through `scripts/ruflo/bounded-mcp.mjs`, which caps input message bytes,
collection sizes, depth and aggregate nodes before handing messages to Ruflo. Oversized frames close
the connection; a rejected bounded request receives a JSON-RPC error. The MCP allowlist exposes only
coordination tools. `task_list` has an explicit read approval; mutation tools retain the normal
approval policy. The generated configuration and runtime state are local and excluded from Git.

Run `python3 scripts/ruflo/pilot.py` for the bounded, read-only two-worker test. It uses policy
preflight, a restricted `npx` shim that maps only `ruflo@latest` to the pinned installation, worker
and outer deadlines, and verifies each worker's output. Codex must be on `PATH` and authenticated.
The pilot is a connectivity test, not a general-purpose task runner. It may require outside-sandbox
execution to access the local Codex runtime and Ruflo policy-trust storage.

## Verified behavior

On 2026-11-14, the pilot launched two real Codex workers concurrently against this checkout, and both
returned the expected independent results. A fresh read-only Codex session successfully called the
project Ruflo `task_list` MCP tool with its configured per-tool approval. A separate fresh-session
check confirmed `task_create` remained blocked under a no-approval policy. The project MCP entry
points to this checkout and no longer inherits the stale global Ruflo working directory.

`python3 scripts/ruflo/bootstrap_test.py` checks safe handling of existing configuration and
idempotence without network access. `node --test scripts/ruflo/bounded-mcp.test.mjs` exercises
normal framing, limits, malformed input, and child shutdown. These tests do not establish safety for
arbitrary Ruflo features, CLI commands, or parallel writers.

## Dependency limitation

Ruflo 3.77.1's lockfile contains Zod 3.25.76 and `npm audit` reports a high-severity
[GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) dependency finding.
There is no patched Zod 3 release. Forcing Zod 4 makes the package audit green but does not remove
the vulnerable `zod/v3` compatibility implementation used by some dependencies. The local MCP
input guard reduces exposure for messages entering through this project-scoped server; it is **not**
an upstream Zod fix and does not cover direct Ruflo CLI use or other installations. Use trusted
local inputs, and reassess the dependency before broader adoption.

The associated [CVE record](https://nvd.nist.gov/vuln/detail/CVE-2023-54404) was rejected by
its numbering authority, which considers the memory use bounded by the already-parsed request size.
The GitHub advisory remains active and blocks dependency review, while
[Red Hat's assessment](https://access.redhat.com/security/cve/cve-2023-54404) still describes
an availability risk for applications accepting unbounded inputs. These assessments do not prove
that all Ruflo CLI or SDK inputs pass through this pilot's guard.
GitHub dependency review's `allow-ghsas` exception applies across the action, not just to this
lockfile. Adopting an exception is a separate repository risk decision; it is not a Zod fix.

Do not use `ruflo init --codex` over existing `AGENTS.md`, `.agents/skills`, steering, hooks or
global Codex configuration. Decide isolation, ownership, verification and merge strategy before
allowing parallel writers. Ruflo's worker registration or a successful CLI exit alone does not prove
that workers executed successfully.

References: [Ruflo releases](https://github.com/ruvnet/ruflo/releases),
[Ruflo Codex integration](https://github.com/ruvnet/ruflo/blob/main/docs/ruflo-explained.md),
[Ruflo Codex worker](https://github.com/ruvnet/ruflo/blob/main/.claude/agents/dual-mode/codex-worker.md),
and [Codex MCP configuration](https://developers.openai.com/codex/mcp).
