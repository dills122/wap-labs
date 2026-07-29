# Network Preview Service Deployment

This directory packages the production WAP gateway and private WML origin for the existing
DigitalOcean network-preview host. It does not create infrastructure, change OpenTofu state, or
publish DNS. Every service deployment forces Docker ingress back to `sealed`; public UDP 9200 is
a separate, explicit operation after the infrastructure publication plan is approved.

## Security boundary

The production stack differs intentionally from root `docker-compose.yml`, which remains a local
development fixture:

- only UDP 9200 is published by Docker;
- Kannel administration and wapbox ports stay inside its container and accept loopback only;
- Kannel passwords are random host files owned by the fixed Kannel UID with mode `0400`, mounted
  as Compose secrets, and never placed in image layers or environment variables;
- both containers run as fixed non-root users with read-only root filesystems, all Linux
  capabilities dropped, `no-new-privileges`, PID/memory/CPU ceilings, bounded logs, and health
  checks;
- the origin is reachable only over an `internal: true` bridge. Kannel also joins a dedicated
  ingress bridge for UDP publication, while `DOCKER-USER` denies container-initiated traffic to
  the host's public interface;
- the origin accepts only its Compose service host, and Kannel maps only the three approved public
  names plus the explicit local/Tailnet smoke aliases;
- `/usr/local/sbin/waves-docker-firewall` owns a dedicated chain reached first from
  `DOCKER-USER`. Its persisted default is `sealed`, which drops every packet entering Docker from
  the host's public interface. Tailnet traffic may reach only UDP 9200, all other host interfaces
  are denied access to Docker bridges, and container traffic may not leave through a host uplink.

In `public` mode, that chain permits only UDP 9200 through both a per-source and global packet-rate
limit before dropping all other public-interface container traffic. DigitalOcean Cloud Firewall
and UFW remain independent outer layers; passing one layer never substitutes for another.

## Build a release locally

Release builds require a clean committed worktree plus Docker Buildx, Grype, and Syft. They build
Linux AMD64 images off-host, fail on high or critical image vulnerabilities, generate CycloneDX
SBOMs, and package the exact image config digests into a checksummed archive:

```sh
scripts/build-network-preview-release.sh <release-id>
```

Generated archives live below ignored `dist/network-preview/` by default and contain no
credentials. Do not commit them.

## Deploy privately

The target must be named explicitly and be reachable through the existing Tailscale SSH path:

```sh
scripts/deploy-network-preview-private.sh \
  dist/network-preview/waves-network-preview-<release-id>.tar.gz \
  waves@waves-network-preview
```

The remote installer verifies the archive checksum, Linux AMD64 platform, and canonical config
digest of both loaded images. The config digest check works with both Docker's classic image store
and its containerd image store and binds each image's runtime configuration and root filesystem.
The installer then generates host-local 256-bit Kannel secrets when absent, installs the persistent
firewall and systemd units,
forces firewall mode to `sealed`, starts the containers, and waits for their health checks. A
failed start restores the prior release when one exists. The archive is removed from `/tmp` after
success. With no prior release, a failed start explicitly removes the failed stateless containers
and networks while leaving ingress sealed.

Private validation can use the Tailnet-only hostname with the test client's private-destination
policy:

```sh
WAP_SMOKE_URL=wap://waves-network-preview/ \
WAP_SMOKE_LOGIN_URL=wap://waves-network-preview/login \
WAP_SMOKE_REGISTER_URL=wap://waves-network-preview/register \
WAP_SMOKE_EXAMPLE_URL=wap://waves-network-preview/examples/index.wml \
WAP_SMOKE_PORTAL_EXAMPLE_URL=wap://waves-network-preview/examples/pocket-portal.wml \
WAP_SMOKE_PREFERENCES_EXAMPLE_URL=wap://waves-network-preview/examples/preferences.wml \
WAP_SMOKE_INTEROP_EXAMPLE_URL=wap://waves-network-preview/examples/interop-check.wml \
WAP_SMOKE_DENIED_URL=wap://waves-network-preview:9200/ \
TRANSPORT_WAP_SKIP_INTERNAL_HEALTH=1 \
  make smoke-transport-wap
```

The smoke suite requires each compiled example to return `application/vnd.wap.wmlc`, retain raw
WBXML bytes beginning `03 0a`, and normalize to its stable WML markers. It also requests an
intentionally unmapped origin and requires an explicit failure.
Kannel's final catch-all maps both HTTP and HTTPS origins to a local 404 route, while the host
firewall independently prevents container egress.

The generic smoke wrapper's local HTTP diagnostics are unavailable remotely because the
production stack correctly does not publish Kannel admin or WML health ports. Use `systemctl
status waves-network-preview` and `docker compose` through Tailscale SSH for host-side diagnostics.

## Rollback and emergency disable

Seal Docker ingress immediately without stopping the private service:

```sh
sudo waves-docker-firewall set sealed
```

Roll back to the previously healthy release:

```sh
sudo waves-network-preview-rollback
```

Rollback always leaves ingress sealed. It never changes DNS, DigitalOcean Cloud Firewall, or
OpenTofu state.

## Public publication boundary

Do not switch the host firewall to `public` from this deployment procedure. Publication requires:

1. a reviewed OpenTofu plan that changes only the expected DNS records and UDP 9200 firewall
   rule;
2. explicit approval for that exact plan;
3. successful application and verification of the external cloud firewall and DNS state;
4. `sudo waves-docker-firewall set public` on the host;
5. external positive UDP 9200 and negative internal-port probes;
6. a tested `set sealed` kill switch.

The emergency order is the reverse: set the host firewall to `sealed` first, then remove DNS and
cloud ingress through a separately approved OpenTofu plan.
