---
name: Cloudflare blank-page deploy (pizzeria root app)
description: Why www.pizzeriachezmoi.com served a blank page and the non-obvious constraints of its Cloudflare Pages deploy
---

# Cloudflare blank page — durable lessons

The GitHub repo `infoitalsafari-eng/pizzeria-website` deploys its **repo root** app
to Cloudflare Pages (build `npm run build` → `dist`). The root app and the Replit
`artifacts/pizzeria` app are *different* apps — Cloudflare only ever builds the root,
so any deploy fix must land at the root, not in artifacts.

Non-obvious gotchas for this deploy:

- **Frozen bun lockfile.** Cloudflare auto-detects a committed `bun.lock` and runs
  `bun install --frozen-lockfile`. A drifted lockfile fails the whole build. You
  cannot just gitignore it (Cloudflare reads the committed file) — regenerate it
  in-sync with the *same* bun version Cloudflare uses, and verify
  `bun install --frozen-lockfile` exits 0.
  **Why:** the original upload committed a bun lockfile that no longer matched.

- **A Vite "Could not resolve ./pages/X" build error = blank page, recoverable from
  git history.** The deployed commits were missing source files that `src/App.tsx`
  and the components imported. The complete app lived in an earlier checkpoint; recover
  with `git show <ref>:<path> > <path>` (see replit-git-constraints.md).
  **Why:** a "baseline checkpoint" commit had deleted them and they were never
  re-added to the deployed branch.

- **SPA deep links 404 on Cloudflare Pages.** The app uses `BrowserRouter`, but
  Cloudflare ignores `netlify.toml` redirects. Need `public/_redirects` with
  `/*  /index.html  200` so `/menu`, `/heurs` resolve on direct load.

**How to apply:** when a Pages deploy is blank, reproduce `npm run build` locally
first; a resolve error means missing source. Always add an SPA fallback for
client-side routers on Cloudflare.
