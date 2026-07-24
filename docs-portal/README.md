# WAP Labs Atlas

Astro-based project, planning, compliance, source, and document portal for WAP Labs.

The portal is a view over canonical repository artifacts. Do not copy planning or source metadata
into this package. Update the JSON manifests or active Markdown documents that already own the
information, then rebuild.

## Run locally

```sh
pnpm install
pnpm dev
```

## Validate

```sh
pnpm build
```

The static production build is emitted under `dist/` with the configured `/wap-labs/atlas` base.
