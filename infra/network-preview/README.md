# Network Preview Infrastructure

This directory owns the OpenTofu configuration for the public WAP network preview described in
`docs/waves/PUBLIC_WAP_LAB_PRERELEASE_PLAN.md`.

The current `INF-101` checkpoint is intentionally resource-free. It pins the toolchain and
DigitalOcean provider, defines the encrypted Cloudflare R2 backend contract, and supplies static
validation plus an isolated future lock integration test. It does not create an account, bucket,
GitHub environment, DNS record, Droplet, firewall, Reserved IP, deployment, or public endpoint.

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

The intended state key is `wap-labs/network-preview/preview.tfstate` without a leading slash.
Native S3 lock-file mode is mandatory. State and plan encryption are enforced with PBKDF2 and
AES-GCM; the passphrase is provided through `TF_VAR_state_encryption_passphrase` in a protected
environment.

R2 does not provide ordinary S3 bucket versioning. A future manually approved apply workflow must
copy the already encrypted state object to a timestamped recovery prefix before changing cloud
resources. That protected workflow remains unfinished `INF-101` acceptance scope; it is not
implemented or executed by this offline checkpoint.

## Access-backed gates

`INF-101` remains incomplete until all of the following are true:

1. `PRE-001` accepts the provider, Toronto region, cost owner, and fallback.
2. `PRE-003` creates the project, private R2 bucket, least-privilege credentials, protected plan
   and apply environments, billing alert, and two-maintainer recovery access.
3. The protected R2 test proves acquisition, contention failure, normal release, stale-lock
   recovery, and cleanup against a unique non-production key.
4. A protected DigitalOcean speculative plan succeeds without exposing a plaintext plan or state.

Executing a cloud apply remains explicitly out of scope for this offline checkpoint. Implementing
the serialized, manually approved apply and state-recovery automation remains part of `INF-101`
after `PRE-003` supplies its protected trust boundary.
