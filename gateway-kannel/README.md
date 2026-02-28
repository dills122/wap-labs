# gateway-kannel

This folder tracks the gateway role for the modern browser track.

## Current status

Runtime/config files already exist in:

- `docker/kannel/Dockerfile`
- `docker/kannel/kannel.conf`
- `docker/kannel/start.sh`

Use this folder for future gateway-specific docs, profiles, and integration tests focused on WSP/WDP behavior.

## MVP requirements

- UDP WSP endpoint reachable on `9201`
- Mapping to HTTP/WML upstreams
- Stable local dev config for transport service integration
