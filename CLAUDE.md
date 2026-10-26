# CLAUDE.md

## Context

CS 1710 final project: the gap between CEO pay and median worker pay, for labor union representatives. The site is one scrolling story page that follows the Milestone 7 storyboard.

## Commands

```sh
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in build/ (adapter-static, every page pre-rendered)
```

## Stack (same as the course labs)

- SvelteKit 3 on Vite 8, plain JavaScript, Svelte 5 runes forced in `vite.config.js`.
- D3 v7 handles scales, axes and CSV loading. Svelte renders the marks with `{#each}`.
- `src/lib` is imported as `#lib/...`.
- GitHub Pages serves the site under `BASE_PATH`, so links must use `resolve()` and files must use `asset()` from `$app/paths`.
