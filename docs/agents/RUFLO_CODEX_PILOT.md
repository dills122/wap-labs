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

## Supervised compliance loop

Use this local runner with Ruflo installed by the bootstrap above. Start from a
clean feature branch in a linked Git worktree. From a checkout containing the
runner, create a trusted local JSON packet with the focused work item, its
directly mapped open clauses, a bounded objective, and the exact paths the
writer may edit. Include at least one source-derived acceptance check.

```json
{
  "workItem": "WML-201",
  "clauses": ["WML-CL-PARAGRAPH-ALIGNMENT-DEFAULT"],
  "objective": "Add a WML 1.3 fixture named wml_fx_paragraph_alignment_default that compares unspecified paragraph alignment with explicit left alignment.",
  "paths": ["engine-wasm/engine/src/layout/flow_layout.rs"],
  "checks": [
    ["cargo", "test", "--offline", "--manifest-path", "engine-wasm/engine/Cargo.toml", "wml_fx_paragraph_alignment_default"]
  ],
  "timeoutSeconds": 180
}
```

The packet's checks are argument arrays executed locally. Review them as you
would any command you run in the repository. Confirm that filtered test
commands actually ran the intended test when inspecting the evidence. For
host-visible changes include the appropriate native, WASM, and executable story
checks in the packet.

```sh
python3 scripts/ruflo/compliance_loop.py claim /path/to/packet.json --worktree /path/to/linked-worktree
python3 scripts/ruflo/compliance_loop.py work
python3 scripts/ruflo/compliance_loop.py status
```

A failed or timed-out writer can leave a scoped checkpoint. Use `resume` on
that exact checkpoint. The runner checks the branch head and content digest
before starting a fresh writer. Inspect a complete candidate and create one
local commit directly on the pinned base. Run `verify` from the runner
checkout. Verification checks the candidate content, reruns the packet checks
and the full compliance gate, and requests a fresh read-only Ruflo review of
that commit.

```sh
python3 scripts/ruflo/compliance_loop.py verify
python3 scripts/ruflo/compliance_loop.py release
```

Use the repo's existing local exclusions for installed tool metadata. For
example, a fresh checkout with Serena enabled may need `/.serena/` in Git's
local exclude file. Inspect any unexpected changes before retrying. The runner
verifies the whole candidate worktree stays clean through review.

`status` reports the active claim and the locations of the saved evidence.
The repository lock covers all linked worktrees sharing the Git common
directory. A claim stays active through verification. After verification a lead
serializes canonical ledger, graph, and rollup changes against the current
integration base. Review the result and confirm the actual merge before
closing the backlog item. Use `release` to free a verified claim and keep its
receipt. Use `abandon` for work that cannot proceed. Both leave the worktree
and logs available.

Ordinary verification failures retain the exact candidate and their logs.
Use `resume` to request a revision and amend the candidate after inspection.
A timed-out verification command or interrupted coordinator can leave an
unsettled claim. A check may have created a separate process group, so confirm
that its processes have exited before recovering the claim manually. The
runner blocks another writer in that state.

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
The GitHub advisory remains active, while
[Red Hat's assessment](https://access.redhat.com/security/cve/cve-2023-54404) still describes
an availability risk for applications accepting unbounded inputs. These assessments do not prove
that all Ruflo CLI or SDK inputs pass through this pilot's guard.
GitHub dependency review has an explicit `allow-ghsas` exception for this advisory. It applies
repository-wide, not just to this lockfile, so future introductions of this same advisory will not
fail that action. This is an accepted risk for the local pilot, not a Zod fix. Remove the exception
when Ruflo and its dependencies no longer require vulnerable legacy Zod, and audit direct CLI and
SDK paths before expanding the pilot beyond trusted inputs.

Do not use `ruflo init --codex` over existing `AGENTS.md`, `.agents/skills`, steering, hooks or
global Codex configuration. Decide isolation, ownership, verification and merge strategy before
allowing parallel writers. Ruflo's worker registration or a successful CLI exit alone does not prove
that workers executed successfully.

References: [Ruflo releases](https://github.com/ruvnet/ruflo/releases),
[Ruflo Codex integration](https://github.com/ruvnet/ruflo/blob/main/docs/ruflo-explained.md),
[Ruflo Codex worker](https://github.com/ruvnet/ruflo/blob/main/.claude/agents/dual-mode/codex-worker.md),
and [Codex MCP configuration](https://developers.openai.com/codex/mcp).
