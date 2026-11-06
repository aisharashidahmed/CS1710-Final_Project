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
- Svelte renders the marks; D3 only draws inside its own axis `<g>` elements (see `SectorBars.svelte` for the pattern). Charts use a fixed `viewBox` with `width: 100%` so they scale with the page.

## Team workflow

Three people work on this page at once, so **each chart lives in its own file and each person edits only their own files**. `src/routes/+page.svelte` already places every chart; ask Ash before changing it.

| File | Chart | Owner |
|---|---|---|
| `src/lib/Hook.svelte`, `SectorBars`, `CompanyStrip`, `PayScatter`, `WorkdaysCard`, page layout and styles | everything else | Ash |
| `src/lib/SlopeChart.svelte` | CEO pay rank vs. pay ratio rank | Aisha / Kayleen |
| `src/lib/PovertyCards.svelte` | 34 companies below the poverty line | Aisha / Kayleen |
| `src/lib/SectorRange.svelte` | most vs. least equal company per sector (range plot) | Aisha / Kayleen |
| `src/lib/PayReceipt.svelte` | pay receipt (novel view) | Aisha / Kayleen |

- Each chart file starts as a "Coming soon" placeholder that describes the plan. Replace the placeholder with the chart.
- A new helper component goes in a new file named after its chart (e.g. `PayReceiptSearch.svelte`). Shared files (`data.js`, `motion.js`, `Tooltip.svelte`, `Placeholder.svelte`, `+layout.svelte`) can be imported but not edited.
- `git pull` before starting, commit only your own files, and pull again before pushing.

## Data each chart receives

`data` is the array of all 492 companies, already loaded and parsed by `loadCompanies()` in `src/lib/data.js`. Do not load the CSV again. Each company has:

| Field | Meaning |
|---|---|
| `ticker`, `company`, `ceo`, `sector` | text |
| `ceoPay` | CEO **total** pay in dollars (2021) |
| `workerPay` | median worker pay in dollars |
| `ratio` | CEO-to-worker pay ratio (2 to 6,474) |
| `workdays`, `workHours` | time for the CEO to earn the median worker's yearly pay (260 workdays / 2,080 hours per year) |
| `startYear` | 2021 − ratio, minus 1 more for BCE years (there is no year 0): year the worker would have had to start working to earn the CEO's one-year pay (negative = BCE) |
| `belowPoverty` | true if `workerPay` < $26,500 (2021 poverty line, family of four) |
| `ceoPayRank`, `ratioRank` | 1 = highest CEO pay / highest ratio |

When a chart stores a picked or hovered company in state, use `$state.raw(...)`, not `$state(...)`. Plain `$state` wraps the object in a proxy, so `d === picked` stops matching the original company object (or store the `ticker` instead and compare tickers).

`SectorRange` also receives `order`: sector names from highest to lowest median ratio, the same order as the sector bars. Helpers in `data.js`: `money` ($212,701,169), `moneyShort` ($213M), `ratioLabel` (6,474:1), and `SECTOR_EXAMPLES[sector]` (plain examples, e.g. "retail, restaurants, travel, cars").

## Look and feel

- **Color story** (CSS variables defined in `src/routes/+layout.svelte`, use them instead of hex codes):
  - `var(--ceo)` red = CEO pay
  - `var(--worker)` blue = worker pay
  - `var(--company)` / `var(--company-dark)` light / dark purple = a company or its ratio
  - `var(--sector)` / `var(--sector-dark)` gray / near-black = a sector
  - `var(--bg)` warm off-white page background, `var(--card)` a deeper cream for cards, boxes, tooltips and buttons, `var(--ceo-tint)` / `var(--worker-tint)` pale red / blue box backgrounds. Never use white (#fff) backgrounds: white next to cream is hard on the eyes.
- In text, wrap CEO numbers in `<span class="ceo">` and worker numbers in `<span class="worker">`.
- Hover: show the shared `Tooltip.svelte` (`tip = { company, x, y, flip, extra? }`, where `extra` is an optional last line) and outline the hovered mark in `#111`. Highlight = fade others to about 0.15 opacity; never remove them.
- Ratios run from 2:1 to 6,474:1 (24 companies are above 1,000:1), so ratio and pay axes usually need a log scale; if a chart uses a linear scale, say why.
- Transitions: import `DURATION` and `easing` from `#lib/motion.js` (500ms, or 0 when the reader prefers reduced motion). See `CompanyStrip.svelte`: dots move with a CSS `transform` transition and enter/leave with Svelte's `fade`.
- Wrap each SVG chart in `<div class="chart">` (the SVG as its direct child). On phones it then keeps a 600px minimum width and scrolls sideways, so labels stay readable.
- Keep the plain, short sentence style of the rest of the page.
