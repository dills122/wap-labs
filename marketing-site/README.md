# Marketing Site (Astro)

Developer-facing landing/info site built with Astro static output.

- Source: `marketing-site/`
- Framework: Astro
- Deployed location on GitHub Pages: `/`
- Simulator location on GitHub Pages: `/simulator/`
- Project Atlas location on GitHub Pages: `/atlas/` (built from `docs-portal/`)

## Local commands

```bash
cd marketing-site
pnpm install
pnpm run dev
pnpm run build
```

Deployment behavior is defined in `.github/workflows/pages.yml`.

## Product image provenance

The product captures under `public/` are first-party WAP Labs assets. They show the real Waves
browser story entry backed by the WaveNav WASM engine and repository-owned deterministic example
content; they are not composited browser chrome or third-party stock imagery.

- `waves-browser-handset.webp`: current handset-stage development view.
- `waves-browser-inspector.webp`: current handset view with Developer Tools open.

Both captures were generated on 2026-07-30 from `origin/main` commit `234339ac` with the repository's
rendered-accessibility runner at a 1024 by 768 CSS-pixel viewport, then converted lossily to WebP at
quality 86 for the public site. Project source and product-owned captures use the repository's MIT
licence. Regenerate captures from current main before materially changing any product claim tied to
the pictured interface.
