# Network Preview Owner Setup

This is the owner checklist for `PRE-001` and `PRE-003`. It describes future manual account
configuration; it does not assert that any account, project, bucket, token, GitHub environment, or
recovery record exists. Completing this checklist does not authorize a workflow dispatch, remote
plan, apply, destroy, force-unlock, DNS change, or other cloud/state mutation.

Never paste a credential into the repository, a pull request, an issue, workflow input, log, or
chat. Record only redacted identifiers, scope lists, settings, and reviewer evidence.

## Owner decisions

Record these decisions before creating credentials:

| Decision                  | Recommended starting value                                         | Owner evidence                        |
| ------------------------- | ------------------------------------------------------------------ | ------------------------------------- |
| DigitalOcean team/account | Existing owner-controlled team with billing enabled                | Named owner and recovery maintainer   |
| DigitalOcean project      | Existing default project `dills122`                                | Project name/ID, without credentials  |
| Region                    | `nyc3`, then `nyc1`, subject to authenticated size availability    | Selected region and preflight date    |
| Initial size              | `s-1vcpu-512mb-10gb` at approximately US$4/month                   | Size-catalog result and current price |
| Size fallback             | US$6 1 GiB in `nyc3`; `tor1` would reopen `PRE-001`                | Named owner approval; never automatic |
| Billing alert             | US$10 monthly anomaly threshold                                    | Alert recipient and screenshot/export |
| R2 jurisdiction/location  | Default jurisdiction, Eastern North America (`enam`) location hint | Bucket settings                       |
| R2 bucket                 | Private Standard bucket: `wap-labs-opentofu-state-shrimpworks`     | Bucket name and account ID            |
| Plan operator             | Primary repository owner                                           | GitHub username                       |
| Shared-CI apply reviewer  | Unassigned; a second trusted maintainer is required                | Blocks shared/public CI deployment    |

The DigitalOcean billing alert is notification only, not a spending cap. The initial state bucket
should remain private, with no public development URL, custom domain, or CORS configuration. The
current backend uses the default R2 endpoint; selecting an EU or FedRAMP jurisdiction would require
an endpoint/code change and new validation.

Current owner selections:

- send the DigitalOcean billing alert to the owner's primary account email, which is also used for
  Git and GitHub;
- use the Cloudflare-managed `shrimpworks.dev` zone with exact DNS-only records for
  `home.wap.shrimpworks.dev`, `forms.wap.shrimpworks.dev`, and
  `interop.wap.shrimpworks.dev`;
- use `wap-labs-opentofu-state-shrimpworks` for the private R2 bucket, subject to availability in
  the account;
- use an owner-local deployment for the initial restricted test host. Keep the shared/public
  `PRE-003` gate blocked because the owner cannot also supply independent apply review and
  two-maintainer recovery evidence;
- use the existing Reef tailnet for private administration, with standard OpenSSH over
  `tailscale0` and no public TCP 22.

### Northeast region preflight

DigitalOcean region/size inventory can vary. Before accepting `PRE-001`, use the control panel or
an authenticated read-only API request to prove the exact size/region pair is currently available.
A temporary custom-scoped token needs only `regions:read` and `sizes:read` for this check and can be
revoked immediately afterward. The equivalent API evidence is the `s-1vcpu-512mb-10gb` size entry
reporting `available: true` and listing the selected New York region.

If the 512 MiB size is unavailable in both accepted New York regions, stop and record the owner's
choice to use the US$6 1 GiB `nyc3` fallback. Retaining `tor1` would instead reopen `PRE-001`. Do
not create a Droplet and do not silently change the cost or location.

DigitalOcean references:

- [region inventory](https://docs.digitalocean.com/reference/api/reference/regions/)
- [size inventory](https://docs.digitalocean.com/reference/api/reference/sizes/)
- [Droplet pricing](https://docs.digitalocean.com/products/droplets/details/pricing/)
- [billing alerts](https://docs.digitalocean.com/platform/billing/billing-alerts/)

## DigitalOcean setup

1. Confirm the owner-controlled team, billing method, and billing-alert recipient. A second
   recovery maintainer remains required before moving deployment into shared CI or publishing the
   preview; it does not block the restricted owner-local host.
2. Complete the Northeast region preflight above and record the accepted region, exact size slug,
   current monthly price, and fallback under `PRE-001`.
3. Confirm the existing default project `dills122` remains available. A dedicated project is not
   required; do not create a project, Droplet, Reserved IP, firewall, DNS record, or monitoring
   alert yet.
4. Enable a US$10 monthly billing alert and record its recipient. Treat it as notification, not a
   hard cap.
5. Create one owner-local token using **Custom Scopes**, an expiration compatible with the test
   window, and a name such as `wap-labs-network-preview-local`. Store it only as
   `DIGITALOCEAN_TOKEN` in the mode-`0600` local `.env`; never put it in GitHub, the repository,
   a plan file, or cloud-init.

The owner-local token needs the following exact scopes for both speculative plans and approved
local applies:

```text
account:read
actions:read
droplet:read
droplet:create
droplet:update
droplet:delete
firewall:read
firewall:create
firewall:update
firewall:delete
image:read
monitoring:read
monitoring:create
monitoring:update
monitoring:delete
project:read
regions:read
reserved_ip:read
reserved_ip:create
reserved_ip:update
reserved_ip:delete
sizes:read
ssh_key:read
tag:read
tag:create
tag:delete
vpc:read
```

DigitalOcean identifies `regions:read`, `sizes:read`, `actions:read`, and `image:read` as required
dependencies of `droplet:read`; the remaining permissions match only the declared tag, Droplet,
Reserved IP, project assignment, firewall, and monitor-alert resources. Do not use the global
`api:write`/Full Access scope. Split read-only plan and mutation-capable apply tokens before moving
this workflow into shared CI; the single token is an explicitly local, single-owner bootstrap
boundary.

DigitalOcean token references:

- [creating a custom-scoped token](https://docs.digitalocean.com/reference/api/create-personal-access-token/)
- [current scope catalog](https://docs.digitalocean.com/reference/api/scopes/)
- [`droplet:read` dependencies](https://docs.digitalocean.com/reference/api/scopes/droplet/read/)

## Cloudflare R2 setup

R2 is Cloudflare storage with an S3-compatible API. It does not require an AWS account. The
`AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` labels are the environment-variable names expected
by the S3 client; their values come from Cloudflare.

1. Enable the R2 subscription in the owner-controlled Cloudflare account and confirm its billing
   owner. Included free usage does not remove the need to monitor billing.
2. Create one private Standard bucket in the default jurisdiction, using the `enam` location hint.
   Do not enable public access, a custom domain, or CORS.
3. Create one Cloudflare **Account API token** with **Object Read & Write** access to this bucket
   only. OpenTofu plans need write access because native S3 locking creates and deletes a lock
   object.
4. Copy its one-time **Access Key ID** and **Secret Access Key** directly into the mode-`0600`
   local `.env`, then remove any temporary clipboard/plaintext copy.
5. Record the account ID and bucket name as non-secret local variables. Split the backend token
   before moving execution into shared CI.

Cloudflare references:

- [R2 S3 credentials](https://developers.cloudflare.com/r2/get-started/s3/)
- [bucket-scoped token permissions](https://developers.cloudflare.com/r2/api/tokens/)
- [data locations and `enam` hint](https://developers.cloudflare.com/r2/reference/data-location/)
- [R2 pricing](https://developers.cloudflare.com/r2/pricing/)

### Cloudflare DNS credentials

The R2 S3 credentials cannot manage DNS. Because `shrimpworks.dev` is authoritative on Cloudflare,
OpenTofu-managed DNS uses a separate Cloudflare API token and the pinned Cloudflare provider.

The expected least-privilege boundary is:

- owner-local token: `DNS Write` and `Zone Read`, limited to the single `shrimpworks.dev` zone;
- future shared-CI plan token: `DNS Read` and `Zone Read`, limited to that zone;
- future shared-CI apply token: `DNS Write` and `Zone Read`, limited to that zone.

Do not grant account-wide resources, `Zone Write`, Workers, R2, SSL, cache, or other permissions to
either DNS token. The three records must be DNS-only, not Cloudflare-proxied: the public service is
UDP 9200 and is not an HTTP/HTTPS origin behind Cloudflare's proxy.

Cloudflare reference: [API token permissions](https://developers.cloudflare.com/fundamentals/api/reference/permissions/).

## Tailscale private administration

Use the same owner-controlled tailnet as Reef. The persistent preview host consumes one of the
Personal plan's 50 included tagged-resource slots and does not consume ephemeral-resource minutes.
Before creating the key, confirm the tailnet remains on the $0 Personal plan and has an included
tagged-resource slot available.

Add this least-privilege policy alongside the existing Reef policy:

```json
{
  "tagOwners": {
    "tag:waves-preview": ["autogroup:admin"]
  },
  "grants": [
    {
      "src": ["autogroup:admin"],
      "dst": ["tag:waves-preview"],
      "ip": ["tcp:22"]
    }
  ]
}
```

Merge these entries into the existing policy rather than replacing its `tagOwners` or `grants`.
Then create an auth key with exactly these settings:

- reusable: **off**;
- ephemeral: **off**;
- expiry: **1 day**;
- tag: `tag:waves-preview`;
- pre-approved: **on** only if device approval is enabled.

Store it as `TAILSCALE_AUTH_KEY` in the mode-`0600` local `.env`. The key is included only in the
encrypted saved plan/state and create-time DigitalOcean user data. The host reads it from a
root-only `/run` file, joins as `waves-network-preview`, and deletes the file. Tailscale revokes a
one-off key after first use. Never use a reusable key for this path. OpenSSH remains the host
authentication boundary; Tailscale SSH is intentionally not enabled.

Routine access is `ssh waves@waves-network-preview` through MagicDNS. Public TCP 22 remains absent
from the DigitalOcean firewall. The optional `NETWORK_PREVIEW_ADMIN_CIDRS_JSON` setting is reserved
for a separately reviewed break-glass window and stays `[]` during normal operation.

Tailscale references:

- [Personal plan limits](https://tailscale.com/pricing)
- [auth key types and expiry](https://tailscale.com/docs/features/access-control/auth-keys)
- [server enrollment](https://tailscale.com/kb/1245/set-up-servers)
- [firewall behavior](https://tailscale.com/docs/reference/faq/firewall-ports)

## Encryption passphrase and recovery

Generate one high-entropy passphrase in the owner's password manager and store it as
`TOFU_ENCRYPTION_PASSPHRASE` in the mode-`0600` local `.env`. A lost passphrase makes encrypted
state, plans, and recovery copies unusable. Before shared CI or public exposure, escrow the
passphrase and both providers' recovery procedures to two named maintainers and store the same
value in the protected plan and apply environments.

The initial owner should record where the password-manager entry and credential-revocation
procedures live without exposing any value. Do not test recovery by changing live state during
bootstrap.

## Future GitHub protected environments

These environments are deliberately deferred for the restricted owner-local test. Create them
before shared CI or public exposure, after the account settings and credentials above have been
independently reviewed:

- `network-preview-plan`
- `network-preview-apply`

Configure both environments with:

- deployment branches/tags restricted to selected branch `main` only;
- required reviewers drawn from the named operator/reviewer set;
- self-review prevention enabled;
- administrator bypass disabled;
- no wait timer;
- no environment URL.

The apply reviewer must be independent of the infrastructure change and must not be the person
who dispatched the apply. GitHub releases environment secrets only after its protection rules
pass. An apply environment may be created without a DigitalOcean apply token and must remain
unusable until the reviewed `INF-102` resource scopes are known.

Set these variables identically in both environments except for the selected region if a future
workflow explicitly requires a difference:

```text
NETWORK_PREVIEW_R2_ACCOUNT_ID=<Cloudflare account ID>
NETWORK_PREVIEW_R2_BUCKET=<private bucket name>
NETWORK_PREVIEW_R2_STATE_KEY=wap-labs/network-preview/preview.tfstate
NETWORK_PREVIEW_R2_RECOVERY_PREFIX=wap-labs/network-preview/recovery
NETWORK_PREVIEW_DO_REGION=<accepted account-verified region>
NETWORK_PREVIEW_DO_PROJECT=dills122
NETWORK_PREVIEW_DO_DROPLET_SIZE=s-1vcpu-512mb-10gb
NETWORK_PREVIEW_DO_SSH_KEY_NAME=<existing key name>
NETWORK_PREVIEW_ADMIN_CIDRS_JSON=[]
NETWORK_PREVIEW_WAP_TEST_CIDRS_JSON=[]
NETWORK_PREVIEW_ALERT_EMAIL=<owner email>
NETWORK_PREVIEW_CLOUDFLARE_ZONE_ID=<shrimpworks.dev zone ID>
NETWORK_PREVIEW_PUBLISH_PREVIEW=false
```

Set the environment-scoped secrets as follows:

| GitHub secret                | `network-preview-plan`        | `network-preview-apply`                          |
| ---------------------------- | ----------------------------- | ------------------------------------------------ |
| `AWS_ACCESS_KEY_ID`          | Plan R2 Access Key ID         | Distinct apply R2 Access Key ID                  |
| `AWS_SECRET_ACCESS_KEY`      | Plan R2 Secret Access Key     | Distinct apply R2 Secret Access Key              |
| `TOFU_ENCRYPTION_PASSPHRASE` | Shared escrowed passphrase    | Same shared passphrase                           |
| `DIGITALOCEAN_TOKEN`         | Custom read-scoped plan token | Distinct token with the declared resource scopes |
| `CLOUDFLARE_API_TOKEN`       | Zone-scoped DNS Read token    | Distinct zone-scoped DNS Write token             |
| `TAILSCALE_AUTH_KEY`         | One-off tagged enrollment key | Same exact one-off key until the plan is applied |

GitHub reference: [deployment environments and protection rules](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments).

## Independent review and activation boundary

The reviewer should record redacted evidence of:

- provider/project, accepted region/size, price, fallback, and billing-alert ownership;
- private R2 bucket, default endpoint, bucket-only token scope, and two distinct token IDs;
- DigitalOcean plan-token expiration and exact read scopes;
- environment names, `main` restriction, reviewers, self-review prevention, and bypass disabled;
- exact non-secret variable values and presence—not values—of expected secrets;
- two-maintainer passphrase and credential recovery access.

The owner-local configuration can support a restricted host and speculative plan. It does not
close the shared/public `PRE-003` gate or prove the protected CI path.

Under separate explicit authority, execute the R2 lock test against its unique
`wap-labs/network-preview/tests/<uuid>` prefix. That test intentionally writes/deletes lock
objects and exercises force-unlock. An owner-local speculative plan may follow after offline
validation, but stop after its sanitized review; the exact saved plan still requires separate
owner approval before a local apply. Keep `NETWORK_PREVIEW_PUBLISH_PREVIEW=false` until the
gateway is deployed, tested from the restricted CIDR, and the public exposure gates are accepted.
