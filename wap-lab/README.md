# WAP Lab (Local Legacy WAP Stack)

This project simulates a historical WAP 1.x flow locally:

Client (WAP browser/emulator) -> WSP -> Kannel WAP Gateway -> HTTP -> Node WML Server

## Project Layout

```text
wap-lab/
├── docker/
│   └── kannel/
│       ├── Dockerfile
│       ├── kannel.conf
│       └── start.sh
├── wml-server/
│   ├── package.json
│   ├── server.js
│   ├── viewer.html
│   └── routes/
│       ├── index.wml
│       └── login.wml
├── docker-compose.yml
└── README.md
```

## What It Provides

- Kannel `bearerbox` + `wapbox` as a local carrier-style WAP gateway
- Admin status endpoint on `http://localhost:13000/status`
- WAP entry endpoint on `http://localhost:13002`
- Node/Express WML app server on `http://localhost:3000`
- WML responses served as `Content-Type: text/vnd.wap.wml`

## Key Gateway Settings

Configured in `docker/kannel/kannel.conf`:

- `admin-port = 13000`
- `wapbox-port = 13002`
- `box-allow-ip = 127.0.0.1`
- `wdp-interface-name = "*"`
- WSP/WTP requests are translated by `wapbox` and routed using:
  - `device-home = "http://wml-server:3000/"`
  - `map-url-0 = "http://localhost:13002/* http://wml-server:3000/*"`

## Run the Stack

From the `wap-lab` directory:

```bash
docker compose up --build
```

## Test Endpoints

1. Gateway status:

```bash
curl http://localhost:13000/status?password=changeme
```

2. WML app directly (HTTP):

```bash
curl -i http://localhost:3000/
curl -i http://localhost:3000/login
```

3. WAP gateway endpoint for emulator/bridge target:

```text
http://localhost:13002
```

Use this as the emulator target URL when testing WAP browsing through the local gateway.

## Sample WML Features Included

`routes/index.wml` includes:

- Multiple `<card>` screens
- Navigation between cards
- `<input>` field
- Submit via `<do>` + `<go method="post">`
- `<postfield>` usage

All WML files begin with WAP 1.1 DOCTYPE.

## Optional Bonus: Browser WML Viewer

Open in a normal browser:

```text
http://localhost:3000/viewer
```

This helper fetches `.wml` content and displays each `<card>` as a simple section for quick inspection.

## Notes

- SMS configuration is intentionally omitted.
- No TLS is configured (development only).
- WBXML translation is handled by Kannel `wapbox`.
