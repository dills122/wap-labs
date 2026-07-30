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

`waves-browser-handset.webp` and `waves-browser-inspector.webp` are first-party captures generated
from `origin/main` commit `234339ac` with the rendered-accessibility runner at a 1024 by 768
CSS-pixel viewport. They show the real Waves host and repository-owned deterministic example
content, then were converted to WebP at quality 86 for the public site.
