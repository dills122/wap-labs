# Local Network Preview Deployment

This is the initial single-owner deployment path. It creates real hosted infrastructure from a
clean local checkout while retaining encrypted remote state, an exact saved plan, narrow provider
credentials, restricted administration, default-project verification, monitoring, and an explicit apply boundary. It does not
configure GitHub environments or claim the shared/public `PRE-003` gate.

The first stage is intentionally not public:

- SSH is allowed only from `NETWORK_PREVIEW_ADMIN_CIDRS_JSON`;
- UDP 9200 is allowed only from `NETWORK_PREVIEW_WAP_TEST_CIDRS_JSON`;
- TCP 80/443 and Kannel administration ports are closed inbound;
- the three Cloudflare DNS records are absent;
- `NETWORK_PREVIEW_PUBLISH_PREVIEW` remains `false`.

Public UDP and DNS require a later reviewed plan with `NETWORK_PREVIEW_PUBLISH_PREVIEW=true`,
after the gateway image/configuration and disable path have passed their own checks.

## Local configuration

Keep the environment file outside version control with mode `0600`. In addition to the existing
provider, R2, and encryption values, set these non-secret values:

```dotenv
NETWORK_PREVIEW_DO_PROJECT=dills122
NETWORK_PREVIEW_DO_REGION=nyc3
NETWORK_PREVIEW_DO_DROPLET_SIZE=s-1vcpu-512mb-10gb
NETWORK_PREVIEW_DO_SSH_KEY_NAME=mac
NETWORK_PREVIEW_ADMIN_CIDRS_JSON=["<current-public-ip>/32"]
NETWORK_PREVIEW_WAP_TEST_CIDRS_JSON=["<current-public-ip>/32"]
NETWORK_PREVIEW_ALERT_EMAIL=<owner-email>
NETWORK_PREVIEW_CLOUDFLARE_ZONE_ID=<shrimpworks.dev-zone-id>
NETWORK_PREVIEW_PUBLISH_PREVIEW=false
```

The CIDRs accept only IPv4 `/24` through `/32`; `0.0.0.0/0` is rejected. Prefer the current
operator address as a `/32`. Update and review a replacement plan when that address changes.

The owner-local DigitalOcean and Cloudflare token scopes are recorded in
[`bootstrap/OWNER_SETUP.md`](bootstrap/OWNER_SETUP.md). `AWS_ACCESS_KEY_ID` and
`AWS_SECRET_ACCESS_KEY` are Cloudflare R2 S3-compatible credentials, not AWS credentials.

## Offline verification

Use OpenTofu 1.12.5 exactly:

```sh
make lint-tofu
```

This validates formatting, provider locks, workflow expressions, HCL, shell helpers, and enforced
plan encryption without contacting R2 or either provider.

## Speculative plan

Commit the reviewed configuration before planning. The helper refuses a dirty worktree, validates
the `.env` permissions, initializes the partial R2 backend in a temporary data directory, saves an
encrypted plan below the ignored `.plans/` directory, emits only the sanitized resource/action
summary, and prints the plan SHA-256:

```sh
OPEN_TOFU_BIN=/absolute/path/to/tofu-1.12.5 \
  node scripts/network-preview-local-plan.mjs \
  --env-file /absolute/path/to/wap-labs/.env
```

The plan contacts provider read APIs and briefly creates the native R2 `.tflock` object. It does
not change DigitalOcean, DNS, or application resources.

## Apply boundary

Stop after planning. A local apply requires separate owner approval naming the exact plan path,
SHA-256, source commit, and expected create/update/delete counts. The first apply must prove that
the configured state and lock objects are absent; every later apply must create and verify an
encrypted pre-apply R2 recovery copy before changing resources. Apply, destroy, state restoration,
and force-unlock are never implied by generating a plan.

Rollback for the initial host is an explicitly approved `tofu destroy` of the same state after
capturing required diagnostics. No application data belongs on the disposable host.
