# abstrct.ca

Josh McDougall's personal site: AS-1, The Abstrct Standard. A person, specified as an RFC.

## Local

```bash
npm run dev
```

Serves `site/` at http://localhost:8080 and reloads the page when a file changes. No install step; needs Node 20+.

## Deploy

Pushing to `main` runs `.github/workflows/pages.yml`, which publishes `site/` to GitHub Pages.

One-time setup in the repo: Settings → Pages → Source: **GitHub Actions**. For the custom domain, add it under Settings → Pages → Custom domain and point DNS at GitHub Pages.

## Layout

- `site/index.html`: the standard (the whole home page, styles inline)
- `site/scratch/`: the scratch-card version, kept as Appendix A.5
- `site/hippo.svg`: the hippo (also the favicon)
- `drafts/`: other drafts that lost (changelog, footnotes); not deployed
- `dev.mjs`: the local dev server
