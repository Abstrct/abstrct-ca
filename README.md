# abstrct.ca

Josh McDougall's personal site: a 16-bit house you walk around. Look at things to find the projects. Paco follows you.

## Local

```bash
npm run dev
```

Serves `site/` at http://localhost:8080 and reloads the page when a file changes. No install step; needs Node 20+.

## Deploy

Pushing to `main` runs `.github/workflows/pages.yml`, which publishes `site/` to GitHub Pages.

One-time setup in the repo: Settings → Pages → Source: **GitHub Actions**. For the custom domain, add it under Settings → Pages → Custom domain and point DNS at GitHub Pages.

## Layout

- `site/index.html`, `house.css`, `house.js`: the house (room art is inline SVG; sprites, movement and dialog are in `house.js`)
- `site/as-1/`: AS-1, The Abstrct Standard (the previous home page)
- `site/scratch/`: the scratch-card version, kept as Appendix A.5
- `site/hippo.svg`: the hippo (also the favicon)
- `drafts/`: other drafts that lost (changelog, footnotes); not deployed
- `dev.mjs`: the local dev server
