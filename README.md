# The CEO Pay Gap

CS 1710 final project: a scrolling data story about the gap between CEO pay and median worker pay at S&P 500 companies.

**Live site:** https://aisharashidahmed.github.io/CS1710-Final_Project/

## About the project
Since 2018, U.S. public companies have had to report their CEO's pay and their median worker's pay. This project turns those reports into an interactive story for **labor union representatives**: how big the gap is, how it grew, where it is worst, what drives it, and what could be different. The story ends with a pay receipt for the reader's own company and steps to take to the bargaining table.

## Questions we answer
1. **How big is the gap?** If a pay ratio is 190 to 1, the median worker needs 190 years to earn the CEO's yearly pay. The timeline shows the year each company's worker would have had to start working (Amazon: 4454 BCE).
2. **Has it always been this big?** The U.S. pay ratio from 1965 to 2024, next to falling union membership.
3. **Which sectors have the biggest gaps, and how do companies in the same sector compare?**
4. **Is the gap caused by high CEO pay or low worker pay?** It can be either (Amazon vs. McDonald's).
5. **Who is paid below the poverty line?** The 34 companies whose median worker earns under the poverty line. *Planned:* how much of that pay basic needs (housing, food, transportation, health care) would take.
6. **Where did the money go?** Since 1973, productivity has grown much faster than pay. A profit-sharing chart shows what each worker would get if a company shared part of its 2021 profit.

Questions we dropped or changed along the way:
- **Redistributing CEO pay** became **sharing profits**: spreading a CEO's pay across all workers adds very little per worker (about $11 at Walmart), while even a small share of profit adds far more.
- **Cost of living by state** was dropped: adjusting both the CEO's and the worker's pay by the same prices leaves the ratio unchanged.
- **Pay ratios and labor-investment efficiency** was dropped: published research did not support our original claim.

## Data sources
- **AFL-CIO Executive Paywatch** (Kaggle copy): CEO pay, median worker pay and pay ratio for 492 S&P 500 companies, fiscal year 2021
- **Economic Policy Institute**, State of Working America Data Library: U.S. CEO-to-worker pay ratio, union membership, productivity and pay, 1948–2024
- **SEC EDGAR annual reports (10-K)**: 2021 profit and employee counts for 43 companies
- **Bureau of Labor Statistics**, Consumer Expenditure Survey 2021: household spending on basic needs by income group (for the planned basic-needs view)

Every field is described in [`DATA.md`](DATA.md); where each raw file came from is in [`data/raw/README.md`](data/raw/README.md).

## Important data limitations
- Each company chooses its own median employee, who can be part-time or outside the U.S. This explains some extreme ratios.
- EPI's national pay ratio uses the 350 largest U.S. firms and a different method, so it is higher than our S&P 500 median (408:1 vs. 190:1 in 2021). The two are never mixed in one chart.
- The profit-sharing chart covers 43 companies whose workforce is mostly in the U.S. Franchise restaurants and hotels are left out because their employee counts miss most of the people working under their name. For companies whose year ends mid-year, profit and pay are from the fiscal year ending in 2022.
- Household spending is an average for households in an income group, not one worker's budget, and the top group (top 20% of households) can only estimate a CEO's spending.

The site states these limits next to the charts they affect.

## Team
- Ashle Sanchez
- Aisha Ahmed
- Kayleen Mukire
## Course
This project was created for CS 1710: Data Visualization at Harvard University.
## Process book
Our design process, research questions, sketches, voting process, and design-review notes are documented in the project process book.
## Project status
The site is one scrolling story page:

| Section | Status |
|---|---|
| Hook: pay ratio definition and live counter of Amazon CEO vs. median worker pay | Working |
| Part 1 · Timeline: scroll story that zooms from Berkshire (6:1) to Amazon (4454 BCE), then company search | Working D3 chart |
| Part 2 · History: U.S. pay ratio and union membership, 1965–2024, linked hover, law markers | Working D3 chart |
| Part 3 · Sectors: sector bar chart + company dot plot (hover links, click filters, log/regular scale) | Working D3 chart |
| Part 4 · CEO or worker pay: scatterplot + workdays card, slope chart of CEO pay rank vs. ratio rank | Working D3 charts |
| Part 5 · Poverty line: 34 companies whose median worker is below the poverty line | Working |
| Main point: lowest vs. highest ratio company in each sector | Working D3 chart |
| Where did the money go?: productivity vs. pay since 1948, then a profit-sharing river for 43 companies (search, 0–100% slider) | Working D3 charts |
| Pay receipt (novel view) with image download | Working |
| Take action | Text |

The site uses three sources: the Kaggle copy of AFL-CIO Executive Paywatch (492 S&P 500 companies, fiscal year 2021), the Economic Policy Institute's State of Working America Data Library (U.S. history, 1948–2024), and company profit and employee counts from 10-K annual reports on SEC EDGAR (43 companies). Every field is described in [`DATA.md`](DATA.md).

## Libraries
- [SvelteKit](https://svelte.dev/docs/kit) 3 with [Svelte](https://svelte.dev) 5 (runes) for the page and components
- [D3](https://d3js.org) 7 for scales, axes, shapes, CSV loading and the hover search (`d3.Delaunay`)
- [Vite](https://vite.dev) 8 to run and build the site
- `@sveltejs/adapter-static` to build a static site for GitHub Pages
- Fonts: Source Serif 4 and Source Sans 3 from Google Fonts

All versions are in `package.json`. No other libraries are used.

## Running the site
Requires Node.js.

```sh
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in build/
```

Pushing to `main` deploys the site to GitHub Pages through `.github/workflows/deploy.yml`.

## Data pipeline
```sh
npm run clean           # companies.csv
npm run clean:history   # history.csv and productivity.csv
npm run clean:profits   # profits.csv (run npm run clean first)
```

Field-by-field descriptions of every cleaned file are in [`DATA.md`](DATA.md).

`scripts/clean.js` reads `data/raw/ceo_data_pay_merged_sp500.csv` and writes `static/data/companies.csv`, which the site loads. It:
- turns text money and ratios ("$25,670,673", "1,013:1") into numbers
- fixes sector names (`Consumer%20Discretionary` → `Consumer Discretionary`)
- renames `salary` to `ceo_pay` (the column holds total CEO pay, not base salary)
- drops rows with missing values (none in the current file)
- adds `workdays` and `work_hours` (time for the CEO to earn the median worker's yearly pay), `start_year` (2021 − pay ratio; negative = BCE, shifted back one year because there is no year 0), `below_poverty` (median worker pay under the 2021 poverty line of $26,500 for a family of four), `ceo_pay_rank` and `ratio_rank`

`scripts/clean-history.js` reads `data/raw/epi/ceo_pay_ratio.csv` and `data/raw/epi/historical_union_membership.csv` and writes `static/data/history.csv`: one row per year, 1965–2024, with `pay_ratio` (EPI's realized CEO-to-worker pay ratio for the 350 largest U.S. firms) and `union_share` (percent of workers in a union). It also reads `data/raw/epi/productivity_and_pay_indexes.csv` and writes `static/data/productivity.csv` (productivity vs. pay, 1948–2024). See `data/raw/README.md` for details.

`scripts/clean-profits.js` reads `data/raw/profits_2021.csv` (net income and employees for 54 companies, from their 10-Ks), joins median worker pay and CEO pay from `companies.csv`, leaves out franchises, hotels and companies with mostly non-U.S. workforces (reasons listed in the script), and writes `static/data/profits.csv` (43 companies).

## Project structure
```
data/raw/              original data, unchanged
scripts/clean.js       company data cleaning (npm run clean)
scripts/clean-history.js  history and productivity data cleaning (npm run clean:history)
scripts/clean-profits.js  profit data cleaning (npm run clean:profits)
DATA.md                what every field in static/data/ means
static/data/           cleaned data loaded by the site
src/routes/+page.svelte  the story page and shared chart state
src/lib/               charts and helpers
  data.js              loads every CSV in static/data/, formatting helpers
  Hook.svelte          live pay counter
  TimelineStory.svelte scroll story around the timeline
  PyramidTimeline.svelte  start-year timeline (unit chart)
  TimeCompare.svelte   years, careers and CEO time for one company
  CompanySearch.svelte type-to-search box
  PayHistory.svelte    pay ratio and union membership, 1965–2024
  SectionNav.svelte    sticky section menu
  SectorBars.svelte    sector bar chart
  CompanyStrip.svelte  company dot plot
  PayScatter.svelte    CEO vs. worker pay scatterplot
  WorkdaysCard.svelte  workdays detail for a clicked company
  SlopeChart.svelte    CEO pay rank vs. pay ratio rank
  PovertyCards.svelte  companies below the poverty line
  SectorRange.svelte   lowest vs. highest ratio per sector
  ProductivityPay.svelte  productivity vs. pay, 1948–2024
  ProfitRiver.svelte   profit-sharing river (search + slider)
  PayReceipt.svelte    pay receipt (novel view)
  Tooltip.svelte       hover details
  Placeholder.svelte   loading boxes
```
