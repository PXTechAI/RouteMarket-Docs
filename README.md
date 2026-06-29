# PX06-RouteLab-Docs

Standalone Fumadocs repository for the RouteLab public documentation site.

## Local Development

```bash
corepack enable
pnpm install
pnpm dev
```

The local dev server starts on `http://localhost:3004`.

## Build Static Output

```bash
pnpm build
```

The static export is generated in `out/`.

## GitHub Pages

This repository includes a GitHub Pages workflow at `.github/workflows/deploy-pages.yml`.

- Default mode: deploy to `https://<owner>.github.io/<repo>`
- Custom domain mode: set repository variable `DOCS_CUSTOM_DOMAIN`, for example `docs.routemarket.ai`

When `DOCS_CUSTOM_DOMAIN` is set, the workflow:

- builds with `NEXT_PUBLIC_DOCS_SITE_URL=https://<custom-domain>`
- removes the GitHub Pages repo base path
- writes `out/CNAME` automatically before deployment
