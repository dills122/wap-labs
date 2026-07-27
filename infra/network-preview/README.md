# Network Preview Infrastructure

This directory owns the OpenTofu configuration for the public WAP network preview described in
`docs/waves/PUBLIC_WAP_LAB_PRERELEASE_PLAN.md`.

The current `INF-101` checkpoint is intentionally resource-free. It pins the toolchain and
DigitalOcean provider, defines the encrypted Cloudflare R2 backend contract, and supplies static
validation, protected plan/apply workflow definitions, recovery-copy automation, and an isolated
future lock integration test. It does not create an account, bucket, GitHub environment, DNS
record, Droplet, firewall, Reserved IP, deployment, or public endpoint. The protected workflows
remain unusable until `PRE-001` and `PRE-003` establish and independently review their trust
boundary.

## Layout

- `bootstrap/`: manual trust-root and protected-environment prerequisites.
- `environments/preview/`: the preview root module. `INF-102` will add cloud resources here only
  after `PRE-001` and `PRE-003` are accepted.
- `tests/r2-lock/`: an isolated lock holder used only by the access-backed R2 integration test.

Do not introduce shared modules until a second real environment creates demonstrated repetition.

## Pinned toolchain

- OpenTofu: `1.12.5`, from `.opentofu-version`
- DigitalOcean provider: `2.96.0`
- Provider checksums: committed for `linux_amd64`, `darwin_arm64`, and `darwin_amd64`

The local OpenTofu binary must match `.opentofu-version`. Regenerate the provider lock file only
as an intentional dependency update:

```sh
tofu -chdir=infra/network-preview/environments/preview providers lock \
  -platform=linux_amd64 \
  -platform=darwin_arm64 \
  -platform=darwin_amd64
```

## Static validation

Static checks neither contact R2 nor configure the DigitalOcean provider. The passphrase below is
a non-secret validation sentinel; it must never be used for remote state.

```sh
tofu fmt -check -recursive infra/network-preview
TF_VAR_state_encryption_passphrase=offline-validation-only-not-for-state \
  tofu -chdir=infra/network-preview/environments/preview \
  init -backend=false -lockfile=readonly
TF_VAR_state_encryption_passphrase=offline-validation-only-not-for-state \
  tofu -chdir=infra/network-preview/environments/preview validate
sh -n scripts/ci/check-network-preview-r2-lock.sh
```

The same contract is available as `make lint-tofu` and is enforced by
`.github/workflows/opentofu.yml` without repository secrets.

## Remote backend contract

The `s3` backend is partial. Bucket, key, and endpoint values are supplied only at runtime; R2
credentials use the standard `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` environment
variables. Do not commit backend configuration files, credentials, `.tfvars`, state, or plans.
Saved plans must live below the environment's ignored `.plans/` directory, for example
`infra/network-preview/environments/preview/.plans/preview.tfplan`; do not use ad hoc tracked or
workspace-root plan paths.

The intended state key is `wap-labs/network-preview/preview.tfstate` without a leading slash.
Native S3 lock-file mode is mandatory. State and plan encryption are enforced with PBKDF2 and
AES-GCM; the passphrase is provided through `TF_VAR_state_encryption_passphrase` in a protected
environment.

R2 does not provide ordinary S3 bucket versioning. The manually approved apply workflow copies
the already encrypted state object to the fixed `wap-labs/network-preview/recovery` prefix before
changing cloud resources. Its conditional write refuses an existing destination; object metadata
records the source key and SHA-256, source commit, apply run ID/attempt, and creation time. The
workflow downloads and compares the source and recovery digests, then rechecks them immediately
before apply. This automation is implemented but intentionally has not been executed against R2.

## Protected plan and apply automation

`.github/workflows/opentofu-protected-plan.yml` and
`.github/workflows/opentofu-protected-apply.yml` preserve one exact reviewed plan from planning
through manual apply:

- protected plan and apply jobs share one preview-state concurrency group with
  `cancel-in-progress: false`; this is intentionally distinct from the cancelable, secret-free
  static workflow;
- the plan job saves the encrypted plan under `.plans/`, records the source commit SHA and the
  plan file's SHA-256 digest, and publishes only that exact encrypted artifact for apply. Trusted
  workflow-run metadata binds the repository, authorized ref, source commit, workflow identity,
  artifact ID, and digest;
- review output is limited to a sanitized summary of action, resource address, and count; raw
  `tofu show -json`, plaintext state, and decrypted plan content must never be logged, uploaded, or
  retained as review artifacts;
- the manually approved apply job accepts a plan workflow-run and artifact ID, then verifies the
  run belongs to this repository and approved workflow/ref, concluded successfully, and matches
  the recorded source commit. It obtains the expected digest from trusted run provenance rather
  than operator input or the downloaded artifact, verifies the plan SHA-256, and applies that
  exact reviewed plan rather than generating a replacement;
- immediately before apply, the job copies the already encrypted R2 state object to a timestamped
  key containing the source commit, workflow run ID and attempt, and a collision-resistant nonce.
  It refuses a pre-existing destination, downloads the encrypted source and recovery objects, and
  requires their SHA-256 digests to match. It then rechecks the encrypted source digest before
  continuing so the recovery copy cannot silently represent stale state;
- retain the five most recent verified pre-apply recovery objects. The finalizer decrypts current
  state only through `tofu state pull` with output discarded, verifies every recovery object's
  metadata and downloaded SHA-256, and prunes older objects only after successful apply. An apply
  failure leaves every recovery object untouched;
- for the first resource-creating apply only, when no state exists to copy, the serialized apply
  job must prove both the configured state and lock keys are absent immediately before applying,
  record that bootstrap condition in trusted run metadata, and verify the resulting encrypted
  remote state through a protected backend operation. Any unexpected object fails closed.

The checked-in automation is access-independent readiness evidence, not access-backed acceptance.
This checkpoint does not create protected environments, handle real credentials, produce a remote
plan, copy remote state, or run `tofu apply`.

## Manual protected flow

After `PRE-001` and `PRE-003` are accepted and an exact operation is authorized:

1. Dispatch **OpenTofu Protected Plan** from `main`. Review its sanitized action/address/count
   summary and record the run ID and artifact ID from the trusted run summary.
2. Dispatch **OpenTofu Protected Apply** from the same current `main` commit with only those two
   IDs. The workflow obtains the commit, run attempt, and plan digest from GitHub's workflow and
   artifact APIs; no digest or commit is accepted from the operator.
3. The apply fails closed if `main` advanced after planning, the run/workflow/repository/ref or
   artifact identity differs, the encrypted plan digest differs, or the seven-day artifact has
   expired. Create and review a new plan instead of bypassing a stale-plan failure.
4. Approve the `network-preview-apply` environment only after independently matching the plan run,
   artifact ID, source commit, and sanitized review. The apply never re-plans.

The plan and apply workflows use the exact shared `opentofu-network-preview-state` concurrency
group with cancellation disabled. The secret-free static workflow remains separately cancelable.

## Failure and recovery behavior

- Before a non-bootstrap apply, the recovery object key contains the source commit, apply run ID,
  run attempt, and a 128-bit nonce. A failed apply or failed post-apply verification performs no
  retention deletion.
- On the first resource-creating apply only, the workflow records a bootstrap mode after proving
  both the state and native `.tflock` keys absent, and reconfirms absence immediately before apply.
- After successful apply, the finalizer requires a decryptable current state, no remaining lock,
  and a downloadable encrypted current-state object before it considers retention.
- Recovery restoration, lock removal, destroy, and force-unlock are intentionally not automated by
  these workflows. They are separate state mutations requiring exact authorization and a reviewed
  runbook decision. The newest verified pre-apply copy remains the rollback source.

## Access-backed gates

`INF-101` remains incomplete until all of the following are true:

1. `PRE-001` accepts the provider, Toronto region, cost owner, and fallback.
2. `PRE-003` creates the project, private R2 bucket, least-privilege credentials, protected plan
   and apply environments, billing alert, and two-maintainer recovery access.
3. The protected R2 test proves acquisition, contention failure, normal release, stale-lock
   recovery, and cleanup against a unique non-production key.
4. A protected DigitalOcean speculative plan succeeds without exposing a plaintext plan or state.
5. An authorized protected plan/apply run proves exact-plan review, non-cancelable shared-state
   serialization, verified encrypted recovery copies, and manual apply approval.

Executing a cloud apply remains explicitly out of scope for this offline checkpoint. Implementing
the serialized, manually approved apply and state-recovery automation is complete at the
access-independent configuration level; live proof remains part of `INF-101` after `PRE-003`
supplies its protected trust boundary and explicit authority is granted.
