# Network Preview Bootstrap

The backend trust root is created manually under `PRE-003`; it cannot safely manage itself.

Follow the [owner setup guide](OWNER_SETUP.md) for the ordered decision, token, local deployment,
and future protected-environment checklist. The initial restricted host may use one owner-local
scoped token from a mode-`0600` `.env`; it is not copied into GitHub and does not close the
shared/public `PRE-003` gate.

Before enabling shared access-backed workflows, named owners must create and review:

- the accepted provider project, account-verified New York region/size, and billing alert;
- a private, dedicated Cloudflare R2 Standard bucket;
- a bucket-scoped R2 Object Read/Write key;
- separate least-privilege DigitalOcean plan and apply credentials;
- protected `network-preview-plan` and `network-preview-apply` GitHub environments;
- two-maintainer recovery access to the encryption passphrase and provider/backend credentials.

Expected protected-environment variables:

- `NETWORK_PREVIEW_R2_ACCOUNT_ID`
- `NETWORK_PREVIEW_R2_BUCKET`
- `NETWORK_PREVIEW_R2_STATE_KEY`
- `NETWORK_PREVIEW_R2_RECOVERY_PREFIX`
- `NETWORK_PREVIEW_DO_REGION`
- `NETWORK_PREVIEW_DO_PROJECT`
- `NETWORK_PREVIEW_DO_DROPLET_SIZE`
- `NETWORK_PREVIEW_DO_SSH_KEY_NAME`
- `NETWORK_PREVIEW_ADMIN_CIDRS_JSON` (optional; omit or set `[]` to keep SSH closed)
- `NETWORK_PREVIEW_WAP_TEST_CIDRS_JSON` (optional; omit or set `[]` to keep UDP 9200 closed)
- `NETWORK_PREVIEW_ALERT_EMAIL`
- `NETWORK_PREVIEW_CLOUDFLARE_ZONE_ID`
- `NETWORK_PREVIEW_PUBLISH_PREVIEW`

Expected environment-scoped secrets, with separate values/scopes where plan and apply differ:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `TOFU_ENCRYPTION_PASSPHRASE`
- `DIGITALOCEAN_TOKEN`
- `CLOUDFLARE_API_TOKEN`
- `TAILSCALE_AUTH_KEY` (one-off, one-day, non-ephemeral, tagged `tag:waves-preview`)

The `AWS_*` names are S3-client conventions. Their values are the Access Key ID and Secret Access
Key shown once when a Cloudflare R2 token is created; no AWS account or AWS credential is involved.

No values belong in this repository, workflow inputs, logs, images, or issue/PR text. The one-off
Tailscale key is the narrow exception: it is carried only in the encrypted plan/state and
create-time cloud-init, automatically revoked after use, and deleted from `/run`. Do not use a
reusable Tailscale key. Do not reference a secret-bearing environment from an enabled job until
its protection rules and reviewers have been configured and independently checked.

Both environments must restrict deployments to `main`. The apply environment must require a
manual reviewer who did not author the reviewed infrastructure change; the plan environment must
also require explicitly approved operators. Keep the two DigitalOcean credentials separately
scoped so the plan credential cannot mutate resources, and restrict the R2 credential to object
read/write/list operations for the one private bucket. GitHub's `GITHUB_TOKEN` remains read-only;
only the apply job receives `actions: read` so it can verify the selected run and artifact IDs.

The workflow definitions alone do not enforce repository environment settings. Record an
independent screenshot/export review of deployment-branch restrictions, required reviewers,
credential scope, and recovery access under `PRE-003` before enabling either workflow.

The bucket, environment, credentials, and cloud resources do not exist merely because this
directory exists. The owner-local host can proceed under
[`../LOCAL_DEPLOYMENT.md`](../LOCAL_DEPLOYMENT.md), but keep shared/public `PRE-003` open until its
independent acceptance evidence is recorded.
