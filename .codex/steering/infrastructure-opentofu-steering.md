# Infrastructure and OpenTofu Steering

Repository-specific steering for `infra/network-preview/` and its related GitHub workflows,
verification scripts, and active documentation.

## Authority and precedence

Apply instructions in this order:

1. system, developer, and explicit user instructions;
2. the nearest applicable `AGENTS.md`, including repository security and contributor standards;
3. this infrastructure steering for implementation details in its scope;
4. active repository planning and runbook documentation;
5. generic external guidance, including installed or AI Central infrastructure skills.

Canonical repository code and active planning evidence decide current implementation and
acceptance status. External guidance may inform a change but must not silently override this file,
claim an access-backed gate, or broaden authority to mutate cloud or repository settings.

## Toolchain and source control

- Pin OpenTofu and every provider exactly. The current `INF-101` pins are OpenTofu `1.12.5` and
  `digitalocean/digitalocean` `2.96.0`; change them only through an intentional dependency update.
- Commit `.terraform.lock.hcl` with checksums for every supported CI/developer platform. Current
  preview support is `linux_amd64`, `darwin_arm64`, and `darwin_amd64`.
- Keep ordinary static validation secret-free and backend-disabled. It may run formatting,
  `init -backend=false -lockfile=readonly`, validation, and provider-lock drift checks.
- Supply partial backend bucket, key, endpoint, and credentials only at runtime. Never commit
  generated state, plans, `.tfvars`/`.tfvars.json`, backend configuration, credentials, or
  `.terraform/` data. Saved local plans belong only below the ignored environment `.plans/`
  directory.
- Do not introduce a shared OpenTofu module until a second real environment demonstrates actual
  repetition.

## Protected state and execution

- Keep protected plan and apply jobs separate. Both must use the same shared-state concurrency
  group with `cancel-in-progress: false`; secret-free static validation uses a distinct cancelable
  group because it never contacts shared state.
- A successful protected plan run records its commit SHA and plan SHA-256 in trusted workflow-run
  provenance. Manual apply must verify the run and artifact IDs, repository, approved workflow and
  ref, source commit, successful conclusion, and expected digest from that provenance rather than
  operator input or the artifact itself. It executes the exact encrypted reviewed plan and must
  not re-plan or substitute another artifact.
- Publish only sanitized action, resource-address, and count summaries. Never log or retain raw
  `tofu show -json`, plaintext state, or decrypted plan content.
- State and plan encryption remain enforced. Before apply, copy the encrypted R2 state to a unique
  recovery key containing commit, run ID, attempt, and a collision-resistant nonce. Refuse a
  pre-existing destination; download and SHA-256 compare the encrypted source and copy, then
  recheck the source digest before changing resources. Retain the five most recent verified
  pre-apply copies; prune older copies only after a successful apply and current-state verification,
  never deleting the last known-good copy.
- For the first resource-creating apply only, a missing state object is permitted only when the
  serialized protected job proves both state and lock keys are absent immediately before apply,
  records that bootstrap fact in trusted run metadata, and verifies the resulting encrypted remote
  state through a protected backend operation. Any unexpected object fails closed.
- Never run `tofu apply`, `tofu destroy`, or `tofu force-unlock` without explicit authority for
  that exact protected operation. Documentation or test scaffolding does not grant execution
  authority.
- R2 lock testing must use the dedicated test prefix and a new collision-resistant run ID, refuse
  pre-existing objects, never target the preview state key, and verify remote cleanup before
  reporting success.

## INF-101 boundary

The offline scaffold may define contracts and secret-free checks, but it must not create accounts,
credentials, protected environments, DNS, provider resources, or deployment configuration. Live
R2 locking, provider planning, serialized manual apply, and recovery-copy evidence remain
unfinished until their prerequisite decisions, credentials, protected environments, and explicit
execution authority exist. Never mark those gates complete from configuration or prose alone.
