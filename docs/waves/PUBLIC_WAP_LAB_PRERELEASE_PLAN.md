# Waves Public WAP Lab and Pre-release Plan

Planning status: proposed; confirm owners, access, and release scope at kickoff

Research checkpoint: 2026-07-26

## Outcome

Give early Waves desktop testers a real, controlled network target:

```text
Waves desktop
  -> connectionless WSP over WDP/UDP 9200
  -> public Kannel gateway
  -> private first-party WML origin
  -> deterministic WML/WBXML test decks
```

The browser-hosted WASM simulator remains network-free and continues to use bundled/local
examples. The public lab is only for the native desktop transport. This milestone is a network
preview, not a Class C compliance claim; release notes must name the exact supported profile and
known limitations.

## Hosting and cost decision

Start with one DigitalOcean Basic Droplet in Toronto (`tor1`): 1 shared vCPU, 512 MiB RAM,
x86_64, and a bounded 1 GiB swap file. Provision it with OpenTofu and attach a free assigned
Reserved IP, Cloud Firewall, DNS records, and provider monitoring.

The expected infrastructure cost is **US$4/month**, plus domain registration and tax. Resize to
the **US$6/month** 1 GiB size only when the required memory soak test demonstrates sustained
pressure, restart, latency, or swap-budget failure. Do not add a paid backup, load balancer,
database, edge proxy, object store, or monitoring product for the first preview. Build images in
CI, keep the host disposable, and recover by rebuilding and moving the Reserved IP.

DigitalOcean is the initial recommendation because Toronto is close to likely first testers, the
low-end plan is pay-as-you-go, and the provider exposes mature OpenTofu/Terraform, firewall,
Reserved IP, and monitoring surfaces. Hetzner is the leading alternative for a Europe-hosted lab:
its EU CX23 offers materially more memory for roughly EUR 5.49/month plus IPv4 and tax, but its
low-cost CX line is not available in North America. Lightsail, IONOS, and OVHcloud remain account
or regional fallbacks rather than the default.

Keep the first Kannel image on x86_64. Multi-architecture images should be a deliberate later
slice backed by image and end-to-end tests, not a launch-time variable.

## Modern WAP service boundary

The public edge must accept WDP/UDP traffic, decode connectionless WSP, fetch only approved
first-party content over a private HTTP path, and return WSP/WBXML. Kannel already owns that role
in this repository; it remains an external interoperability service and is not embedded in the
desktop application.

The current local assets prove the topology but are not production configuration:

- `docker-compose.yml` launches Kannel and the WML origin.
- `docker/kannel/kannel.conf` enables WDP and maps selected URLs to the origin.
- `wml-server/server.js` supplies the current route and behavior parity baseline.
- `scripts/transport-wap-smoke.sh` and native Kannel tests exercise the transport path.

Production work must remove public Kannel administration/internal ports, placeholder secrets,
source bind mounts, and package installation at container startup.

## WML origin decision: Go

Replace the Node/Express `wml-server` with a small standard-library Go service. The origin does
not own WAP, WSP, WBXML, engine behavior, or a shared Rust contract, so a Rust async framework
would add complexity without improving the protocol boundary. Go provides a compact static
binary, simple cross-compilation, deterministic HTTP tests, and a much smaller runtime/container
footprint than the current Node container.

The implementation should use only the standard library where practical, including `net/http`,
`embed`, `encoding/xml`, `sync`, and `crypto/rand`, and must provide:

- exact method/path routing with unknown routes failing closed;
- bounded bodies, headers, sessions, and user records;
- read-header, read, write, and idle timeouts;
- mutex-protected in-memory state with bounded TTL and count;
- injectable clock and identifier generation for deterministic tests;
- structured logs with form, query, and session redaction;
- internal/restricted `/health` and minimal text `/metrics` endpoints;
- `CGO_ENABLED=0`, reproducible build flags, a non-root runtime, and read-only filesystem.

Preserve the current root, login, register, portal, profile, messages, logout, and example
behavior through golden-response and smoke parity tests. Do not carry the current `/gateway`
proxy into the public binary. Keep `/viewer` and `/emulator` as separate local-development tools;
the web simulator must not gain network access.

Suggested layout:

```text
wml-server/
  cmd/wml-server/main.go
  internal/origin/
  internal/origin/testdata/
  routes/
  go.mod
  Dockerfile
```

Remove the Node package and lockfile only after Compose, bootstrap, CI, release-version,
dependency-automation, smoke, and documentation references have migrated and Go parity passes.

## Public topology

### Ingress

- Public UDP 9200 is the only WAP protocol ingress.
- TCP 22 is restricted to a maintainer CIDR or replaced by a private administration overlay.
- TCP 80/443 is not required on the gateway host; instructions and status belong on the existing
  marketing/Atlas static site.
- TCP 13000/13002 and UDP 9201-9208 remain private.
- The preview does not advertise `waps://` or WTLS. It is explicitly an unencrypted test service.

### Runtime

- `wap-gateway`: pinned Kannel image with supervised bearerbox/wapbox and health checks.
- `wml-origin`: static Go binary in a minimal non-root image, without a shell, package manager,
  bind mount, or runtime dependency installation.
- A private Compose network connects gateway and origin.
- Root filesystems are read-only and processes non-root where Kannel permits; any exception is
  documented and capability-constrained.
- Images are pinned by digest and recorded in a rollbackable release manifest.

### First-party test hosts

Use three hostnames under one owned domain:

1. `home.<domain>`: cards, links, softkeys, history, navigation, and small images.
2. `forms.<domain>`: inputs, selects, GET/POST, variables, redirects, validation, and disposable
   session state using obviously fake data.
3. `interop.<domain>`: deterministic status, header, content-type, cache, boundary, WBXML, and
   malformed-response cases with versioned identifiers.

Kannel maps only those exact hosts to private origin routes. Unknown hosts fail closed so the lab
cannot become an arbitrary HTTP proxy. The desktop's gateway endpoint stays separate from its
resource URI. A second owned apex domain is deferred until a cross-registrable-domain test proves
subdomains insufficient.

## Infrastructure and state

Use a private Cloudflare R2 Standard bucket for encrypted OpenTofu state. Its free tier is ample
for this workload. Before adoption, a bootstrap integration test must prove lock acquisition,
contention failure, release, and stale-lock recovery with the S3 backend's native lock-file mode.

The apply workflow must:

- serialize all applies;
- encrypt plans and state with a separately protected key;
- copy the encrypted pre-apply state to a timestamped recovery key and retain a small history,
  because R2 does not provide useful ordinary S3 bucket versioning;
- store backend/provider credentials in protected CI environments, never HCL, committed
  `.tfvars`, plans, cloud-init, or images;
- pin OpenTofu and provider versions and commit `.terraform.lock.hcl`;
- separate infrastructure apply from application deployment;
- require a reviewed plan and manually approved apply environment.

Suggested authored layout:

```text
infra/network-preview/
  bootstrap/
  environments/preview/
  cloud-init/
  README.md

deploy/network-preview/
  compose.yaml
  kannel/
  runbooks/
```

Create shared OpenTofu modules only after actual repetition justifies them.

## Security, abuse, and operations

Public UDP is spoofable and can become an amplification surface. A cloud firewall controls reach,
not protocol safety. Public exposure requires all of the following:

- exact-host allowlisting and no arbitrary URL fetch;
- strict request/response byte ceilings and a measured amplification ratio;
- global and per-source host-level rate limits where feasible;
- bounded Kannel-to-origin concurrency and timeouts;
- no real credentials or personal data in scenarios;
- redaction of form bodies, session values, and sensitive query values;
- random Kannel administration/status credentials stored outside images;
- administration bound to loopback/private networking;
- SSH keys only, non-root administration, and automatic security updates;
- CI image/dependency scanning and an SBOM;
- a tested firewall kill switch, disable runbook, abuse contact, and acceptable-use notice.

HTTP health alone is insufficient. Operate both internal process/container health and an external
synthetic UDP probe that sends a known WSP request and verifies the exact deck/result. Alert on
probe failure, restart loops, sustained CPU/memory or disk pressure, and abnormal UDP traffic.
Rotate bounded logs with short retention. Rehearse a stateless OpenTofu rebuild and Reserved IP
move rather than purchasing a VM backup.

Kubernetes, a managed load balancer, a database, and multi-node availability are out of scope for
the first preview.

## Definition of ready

An implementation item enters a sprint only when:

- its owner and reviewer are named;
- the provider account, project, billing-alert owner, and DNS zone exist;
- required secrets can use protected CI environments;
- acceptance checks are executable and identify the expected endpoint;
- desktop transport work is refreshed from current `origin/main` and reconciled with the current
  WSP-801/802/804/805 evidence rather than planning prose;
- a security-affecting change names its rollback/disable action;
- generated contracts are changed only from their Rust source of truth.

## Sprint 0: access and decisions

Target: 1-2 days before implementation.

| ID        | Work item                        | Estimate | Depends on         | Acceptance                                                                                                                         |
| --------- | -------------------------------- | -------: | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `PRE-001` | Provider/location decision       |        2 | none               | Accept DigitalOcean Toronto or record an alternative's cost, latency, state, and support tradeoffs                                 |
| `PRE-002` | Domain/hostname decision         |        1 | none               | Approve the owned zone and three hosts; explicitly defer or justify cross-apex testing                                             |
| `PRE-003` | Cloud/GitHub access bootstrap    |        2 | `PRE-001`          | Create project, least-privilege provider/R2 credentials, protected environments, billing alert, and two-maintainer recovery access |
| `PRE-004` | Preview threat model/data policy |        3 | this plan          | Accept UDP abuse, open-proxy, logging, test-data, kill-switch, and incident ownership controls                                     |
| `PRE-005` | Release-scope decision           |        2 | current-main audit | Fix supported OS/architectures, preview label, WTLS warning, Class C claim language, and go/no-go owner                            |

`PRE-003` and `PRE-004` block public exposure.

## Sprint 1: Network Preview Foundation

Target: two weeks. Goal: from outside the cloud account, an automated client fetches
deterministic first-party content over connectionless WSP/UDP 9200 from infrastructure that can
be destroyed and rebuilt from OpenTofu.

Capacity assumption: three parallel implementation lanes, 36 points gross, 29 committed, and a
7-point (about 19 percent) buffer for Kannel/cloud/network unknowns.

| Priority | ID         | Work item                                      | Points | Dependencies                   | Acceptance                                                                                                                                                                                  |
| -------: | ---------- | ---------------------------------------------- | -----: | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|        1 | `INF-101`  | OpenTofu bootstrap and CI                      |      5 | `PRE-001`, `PRE-003`           | Pinned provider; encrypted R2 state; tested lock contention/recovery; serialized apply and state copies; fmt/init/validate/speculative-plan CI; no committed secrets                        |
|        2 | `GW-101`   | Production Kannel/container baseline           |      5 | `PRE-004`                      | Immutable image; generated config; non-default secrets; private admin/box ports; exact-host maps; health checks; local GET/POST smoke                                                       |
|        3 | `LAB-101`  | Go WML origin and deterministic multi-host lab |      8 | `PRE-002`                      | Standard-library service; current route/session/example golden parity; three-host matrix; public binary excludes gateway/viewer/emulator; `gofmt`, `go vet ./...`, and `go test ./...` pass |
|        4 | `INF-102`  | Compute, IP, firewall, DNS, bootstrap          |      5 | `INF-101`, `GW-101` interface  | Rebuildable 512 MiB x86 host with bounded swap/limits; only UDP 9200 plus restricted administration public; idempotent cloud-init without long-lived secrets                                |
|        5 | `PERF-101` | 512 MiB memory soak and resize gate            |      2 | `INF-102`, `GW-101`, `LAB-101` | Record RSS, swap, restarts, latency; allow 1 GiB only if the published threshold fails                                                                                                      |
|        6 | `OPS-101`  | External WSP probe and disable runbook         |      4 | `INF-102`, `LAB-101`           | Exact external WSP/WBXML fixture; failure alert; tested rate-limit/firewall kill; redacted logs                                                                                             |

Stretch only after committed acceptance:

- `OPS-102` (3): rebuild and Reserved IP recovery drill.
- `LAB-102` (3): redirect, cache, error, and boundary-case expansion.

### Parallel lanes

| Lane           | Work                   | Start                                  | Overlap risk                                                                             |
| -------------- | ---------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------- |
| A - IaC        | `INF-101` -> `INF-102` | after Sprint 0                         | New `infra/` and CI; moderate deployment-doc overlap                                     |
| B - gateway    | `GW-101`               | after `PRE-004`                        | Kannel, Compose, deployment, and smoke files; conflicts with concurrent Kannel work      |
| C - origin     | `LAB-101`              | after `PRE-002`                        | `wml-server`, Compose, bootstrap, CI, Dependabot, release metadata, setup docs, fixtures |
| D - operations | `OPS-101`              | design early; integrate after endpoint | Smoke/workflow/runbook overlap with lanes A/B at health interfaces                       |

```text
PRE-001/003 -> INF-101 -> INF-102 -> OPS-101
PRE-004     -> GW-101 ------^          ^
PRE-002     -> LAB-101 ----------------|
```

## Sprint 2: Desktop Alpha and Release Candidate

Target: two weeks, re-estimated at kickoff from merged evidence. Goal: a signed/notarized preview
build guides testers to the public lab, completes supported GET/POST scenarios, produces useful
diagnostics, and can roll back without changing the web simulator.

| Priority | ID         | Work item                                  | Initial points | Dependencies                  | Acceptance                                                                                                      |
| -------: | ---------- | ------------------------------------------ | -------------: | ----------------------------- | --------------------------------------------------------------------------------------------------------------- |
|        1 | `DESK-201` | Public gateway profile/resource separation |              5 | Sprint 1, relevant WSP slices | Named desktop preview profile; gateway endpoint remains separate from resource URI; generated contract is clean |
|        2 | `DESK-202` | Guided lab entry/safety messaging          |              5 | `DESK-201`, `LAB-101`         | Bookmarks/onboarding cover all hosts; UI labels unencrypted WAP/no WTLS and forbids real credentials            |
|        3 | `QA-201`   | Public end-to-end release matrix           |              5 | `DESK-201`, `OPS-101`         | Packaged app passes GET/navigation/supported POST; failures identify DNS, UDP, gateway, decode, or engine stage |
|        4 | `REL-201`  | Packaging/signing/notarization             |              5 | `PRE-005`                     | Selected targets produce artifacts, checksums, SBOM, signatures, and install/uninstall guidance                 |
|        5 | `REL-202`  | Preview runbook/release page               |              3 | `QA-201`, `REL-201`           | Public limitations, profile, status, feedback, rollback, and disable process                                    |
|        6 | `OPS-202`  | Replacement/rollback rehearsal             |              3 | `INF-102`, `REL-201`          | Replacement receives Reserved IP and passes probe; previous desktop and server versions restore                 |

Keep auto-update out of the first preview unless signing and update-channel ownership are already
mature. A manual pre-release with checksums is acceptable.

## Release gates

The first public pre-release is allowed only when:

1. The lab is exact-host allowlisted, not an open WAP-to-web proxy.
2. Only UDP 9200 is public for WAP; Kannel administration/internal ports are unreachable.
3. Repeated external synthetic GET and packaged-desktop supported POST both pass.
4. Size, timeout, concurrency, amplification, and rate-limit behavior are tested.
5. Someone other than the author tests the emergency firewall disable action.
6. Infrastructure rebuild and Reserved IP reassignment are demonstrated.
7. Remote state is private, encrypted, lock-tested, serialized, and recoverable.
8. UI/release notes say the transport is unencrypted and WTLS is unsupported.
9. Claims do not exceed current executable Class C evidence.
10. Repository fast/change/full verification and public network E2E checks pass from current main.

## Verification to add or standardize

- `tofu fmt -check -recursive infra/network-preview`
- `tofu init -backend=false` and `tofu validate`
- provider-backed speculative plan in a protected CI environment
- image build, vulnerability scan, and SBOM
- production Compose configuration validation
- `gofmt -l`, `go vet ./...`, and `go test ./...`
- HTTP/WML golden tests for content type, cache, status, escaping, forms, session expiry,
  examples, health, and metrics
- local and external `scripts/transport-wap-smoke.sh` equivalents
- browser/Tauri Kannel tests and generated-contract drift checks
- link, format, and documentation validation
- negative port scan for 13000, 13002, and UDP 9201-9208
- negative proxy test proving an unknown resource host is rejected

## Key risks

| Risk                                | Impact     | Required response                                                                               |
| ----------------------------------- | ---------- | ----------------------------------------------------------------------------------------------- |
| UDP spoofing/reflection             | high       | allowlist, response cap, rate limit, traffic alert, firewall kill switch                        |
| Old Kannel exposure                 | high       | distro-patched/pinned build, isolation, minimal ports, scanning, no admin exposure              |
| Client networks block UDP 9200      | medium     | stage-specific diagnostics and explicit supported-network guidance; no silent protocol fallback |
| R2 backend lock mismatch            | high       | lock integration test, serialized apply, encrypted state copies, forced-unlock runbook          |
| Desktop seam changes                | high       | start from refreshed main; audit WSP evidence; contract-first native/Tauri tests                |
| Nondeterministic/personal test data | medium     | disposable bounded state, synthetic users, deterministic fixtures, redaction                    |
| 512 MiB is too small                | medium     | off-host builds, service limits, swap, soak gate, measured resize to US$6 tier                  |
| Single host outage                  | low-medium | movable IP, stateless rebuild, status page; no premature HA                                     |
| Scope expands to public browsing    | high       | exact first-party hosts; external destinations require a separate product/threat decision       |

## Sources

WAP and Kannel:

- [Kannel status and downloads](https://kannel.org/download.shtml)
- [Kannel 1.4.5 User Guide](https://www.kannel.org/download/1.4.5/userguide-1.4.5/userguide.pdf)
- [Ubuntu 24.04 Kannel package](https://packages.ubuntu.com/noble/kannel)

OpenTofu and state:

- [OpenTofu remote state](https://opentofu.org/docs/language/state/remote/)
- [OpenTofu state storage and locking](https://opentofu.org/docs/language/state/backends/)
- [OpenTofu state and plan encryption](https://opentofu.org/docs/language/state/encryption/)
- [OpenTofu S3 backend](https://opentofu.org/docs/language/settings/backends/s3/)
- [Cloudflare R2 remote backend](https://developers.cloudflare.com/terraform/advanced-topics/remote-backend/)
- [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/)
- [Cloudflare R2 S3 API](https://developers.cloudflare.com/r2/api/s3/api/)
- [Cloudflare R2 consistency](https://developers.cloudflare.com/r2/reference/consistency/)

Provider comparison:

- [DigitalOcean Droplet pricing](https://www.digitalocean.com/pricing/droplets)
- [DigitalOcean cloud-init](https://docs.digitalocean.com/products/droplets/how-to/provide-user-data/)
- [DigitalOcean Cloud Firewall rules](https://docs.digitalocean.com/products/networking/firewalls/how-to/configure-rules/)
- [DigitalOcean Reserved IP pricing](https://docs.digitalocean.com/products/networking/reserved-ips/details/pricing/)
- [Hetzner Cloud OpenTofu provider](https://github.com/hetznercloud/terraform-provider-hcloud)
- [Hetzner locations](https://docs.hetzner.com/cloud/general/locations/)
- [Hetzner price adjustment](https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/)
- [Amazon Lightsail bundles](https://docs.aws.amazon.com/lightsail/latest/userguide/amazon-lightsail-bundles.html)
- [IONOS VPS pricing](https://www.ionos.com/servers/vps)
- [OVHcloud Canada VPS pricing](https://www.ovhcloud.com/en-ca/vps/vps-canada/)
