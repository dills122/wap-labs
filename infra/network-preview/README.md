# Network Preview Infrastructure

This directory owns the OpenTofu configuration for the public WAP network preview described in
`docs/waves/PUBLIC_WAP_LAB_PRERELEASE_PLAN.md`.

The configuration defines a staged single-host preview while keeping execution separate from
authored infrastructure. Its default local deployment creates a hardened Droplet, Reserved IP,
restricted firewall, default-project verification, and free provider monitoring. Public UDP and the three
Cloudflare DNS records remain disabled until `publish_preview` is explicitly enabled. No resource
exists merely because the configuration is checked in, and no apply is authorized by this file.

The initial gate uses the [owner-local deployment path](LOCAL_DEPLOYMENT.md). Protected GitHub
plan/apply automation remains available for a later shared/public operating model and stays
blocked until `PRE-003` has an independent reviewer and recovery maintainer.

## Layout

- `bootstrap/`: manual trust-root and protected-environment prerequisites. Start with the
  [owner setup guide](bootstrap/OWNER_SETUP.md); it separates account configuration from later
  workflow execution.
- `cloud-init/`: deterministic, secret-free host hardening and bootstrap templates.
- `environments/preview/`: the staged preview root module and exact provider locks.
- `tests/r2-lock/`: an isolated lock holder used only by the access-backed R2 integration test.

Do not introduce shared modules until a second real environment creates demonstrated repetition.

## Pinned toolchain

- OpenTofu: `1.12.5`, from `.opentofu-version`
- DigitalOcean provider: `2.96.0`
- Cloudflare provider: `5.22.0`
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

Static checks neither contact R2 nor configure either cloud provider. The passphrase below is a
non-secret validation sentinel; it must never be used for remote state.

```sh
tofu fmt -check -recursive infra/network-preview
scripts/ci/check-network-preview-workflows.sh
TF_VAR_admin_cidrs='["192.0.2.1/32"]' \
TF_VAR_monitoring_alert_email=owner@example.com \
TF_VAR_project_name=offline-validation \
TF_VAR_region=nyc3 \
TF_VAR_ssh_key_name=offline-validation \
TF_VAR_state_encryption_passphrase=offline-validation-only-not-for-state \
TF_VAR_wap_test_cidrs='[]' \
  tofu -chdir=infra/network-preview/environments/preview \
  init -backend=false -lockfile=readonly
TF_VAR_admin_cidrs='["192.0.2.1/32"]' \
TF_VAR_monitoring_alert_email=owner@example.com \
TF_VAR_project_name=offline-validation \
TF_VAR_region=nyc3 \
TF_VAR_ssh_key_name=offline-validation \
TF_VAR_state_encryption_passphrase=offline-validation-only-not-for-state \
TF_VAR_wap_test_cidrs='[]' \
  tofu -chdir=infra/network-preview/environments/preview validate
sh -n scripts/ci/check-network-preview-r2-lock.sh
```

Install the pinned semantic workflow linter with
`go install github.com/rhysd/actionlint/cmd/actionlint@v1.7.12`. The same contract is available as
`make lint-tofu` and is enforced by `.github/workflows/opentofu.yml` without repository secrets.
Passing these checks proves offline configuration and workflow validity; it does not create a
Droplet, configure the `PRE-003` environments, or prove live R2/provider behavior.

## Remote backend contract

The `s3` backend is partial. Bucket, key, and endpoint values are supplied only at runtime; R2
credentials use the standard `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` environment
variables required by the S3-compatible client. Those values are a Cloudflare R2 Access Key ID
and Secret Access Key. They do not require or access an AWS account, service, or bill. Do not
commit backend configuration files, credentials, `.tfvars`, state, or plans.
Saved plans must live below the environment's ignored `.plans/` directory, for example
`infra/network-preview/environments/preview/.plans/preview.tfplan`; do not use ad hoc tracked or
workspace-root plan paths.

The intended state key is `wap-labs/network-preview/preview.tfstate` without a leading slash.
Native S3 lock-file mode is mandatory. State and plan encryption are enforced with PBKDF2 and
AES-GCM; the initial owner-local path reads the passphrase from a mode-`0600` environment file,
while future shared execution stores the same value in protected environments.

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

The checked-in protected automation is access-independent readiness evidence, not access-backed
acceptance. The owner-local plan path is separate and does not create protected environments, copy
remote state, or run `tofu apply`.

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

The restricted owner-local gate may proceed when `PRE-001` is accepted, the private R2 bucket and
scoped local credentials exist, the billing alert is confirmed, offline verification passes, and
an exact encrypted plan is separately approved. Its initial settings keep DNS absent and UDP 9200
limited to the owner's test CIDR. This provides hosted infrastructure evidence without claiming a
public or shared operating model.

`PRE-003` and the shared/public `INF-101` acceptance remain incomplete until protected plan and
apply environments, split credentials, an independent reviewer, two-maintainer recovery access,
live lock/recovery evidence, and the protected exact-plan flow are proven. Public exposure also
remains blocked on `PRE-004` and a tested production gateway. Local configuration or an owner-only
apply must not be reported as that evidence.
