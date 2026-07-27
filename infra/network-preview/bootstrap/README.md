# Network Preview Bootstrap

The backend trust root is created manually under `PRE-003`; it cannot safely manage itself.

Before enabling any access-backed workflow, named owners must create and review:

- the accepted provider project and Toronto-region billing alert;
- a private, dedicated Cloudflare R2 Standard bucket;
- a bucket-scoped R2 Object Read/Write key;
- a least-privilege DigitalOcean plan credential and a separately scoped future apply credential;
- protected `network-preview-plan` and `network-preview-apply` GitHub environments;
- two-maintainer recovery access to the encryption passphrase and provider/backend credentials.

Expected protected-environment variables:

- `NETWORK_PREVIEW_R2_ACCOUNT_ID`
- `NETWORK_PREVIEW_R2_BUCKET`
- `NETWORK_PREVIEW_R2_STATE_KEY`
- `NETWORK_PREVIEW_R2_RECOVERY_PREFIX`
- `NETWORK_PREVIEW_DO_REGION`
- `NETWORK_PREVIEW_DO_PROJECT`

Expected environment-scoped secrets, with separate values/scopes where plan and apply differ:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `TOFU_ENCRYPTION_PASSPHRASE`
- `DIGITALOCEAN_TOKEN`

No values belong in this repository, workflow inputs, logs, plans, cloud-init, images, or issue/PR
text. Do not reference a secret-bearing environment from an enabled job until its protection rules
and reviewers have been configured and independently checked.

The bucket, environment, credentials, and cloud resources do not exist merely because this
directory exists. Keep `PRE-001` and `PRE-003` open until their acceptance evidence is recorded.
