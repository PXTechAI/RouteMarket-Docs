# PX06-RouteMarket-Docs

Standalone Fumadocs repository for the RouteMarket public documentation site.

## Local Development

```bash
corepack enable
pnpm install
pnpm dev
```

The local dev server starts on `http://localhost:3004`.

## Source Documentation Migration

The migration script discovers `/docs/guide` and `/docs/api` pages from the
configured machine-readable source index. Guide pages are independently
rewritten around RouteMarket's account, console, client, and troubleshooting
flows. API pages retain only fact-focused structures such as detected
endpoints, sanitized parameter tables, and transformed code examples.

```bash
pnpm docs:sync-source:dry-run
pnpm docs:sync-source
pnpm docs:sync-api:dry-run
pnpm docs:sync-api
pnpm docs:check-brand
```

The generator keeps existing hand-written pages by default and does not store
the upstream raw Markdown. Registration and client pages use RouteMarket-owned
copy instead of importing upstream prose or screenshots.

## Documentation Images

Documentation images live in `public/images/docs/`. They use RouteMarket-owned
assets or project-generated operation diagrams instead of upstream image URLs.

```bash
pnpm docs:images
```

Use the base-path-aware `DocImage` component in MDX:

```mdx
<DocImage
  src="/images/docs/guide/registration/account.png"
  alt="RouteMarket account registration diagram"
  caption="Register with a team-owned email address and complete verification."
/>
```

Brand and endpoint mappings live in `scripts/source-docs.config.mjs`. Terms and
privacy pages remain excluded because they must reflect actual legal and data
processing practices. Use
`node scripts/sync-source-docs.mjs --write --force` only when intentionally
replacing an existing localized page.

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
