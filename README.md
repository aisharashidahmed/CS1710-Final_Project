# CEO Pay, Worker Pay, and the Cost of Living

CS 1710 final project.

**Live site:** https://aisharashidahmed.github.io/CS1710-Final_Project/

## About the project
This project examines the gap between executive compensation and worker pay in the United States. Through interactive data visualizations, we explore how CEO-to-worker pay disparities vary across companies and economic sectors, how worker pay compares with inflation and cost of living, and how alternative distributions of executive compensation could affect employees.
Our primary audience is labor union representatives and other worker advocates. We want to make large financial differences easier to understand and provide evidence that can support conversations about fair compensation, workplace conditions, and the distribution of corporate wealth.
## Questions we explore
The project focuses on five connected questions:
1. Has typical worker pay kept pace with inflation and the cost of living?
2. Which economic sectors have the largest CEO-to-worker pay gaps?
3. How would employees' compensation change if CEO bonuses or a portion of company profits were redistributed among workers?
4. How does CEO-to-worker pay disparity relate to workers' everyday spending on necessities such as housing, food, transportation, and healthcare?
5. How do individual companies compare with one another within and across sectors?
We initially considered studying whether CEO-to-worker pay ratios were related to labor-investment efficiency. However, existing research did not support the direction of our original claim, so we removed that question from the final focus of the project.
## Data sources
Our analysis draws on publicly available data from:
- Federal Reserve Economic Data (FRED) for consumer price inflation
- Economic Policy Institute for historical CEO-to-worker pay ratios and worker pay indices
- AFL-CIO Executive Paywatch for executive and worker compensation data
- AFL-CIO Company Pay Ratios for company-level pay comparisons
- U.S. Securities and Exchange Commission filings for detailed executive compensation and employee information
- Bureau of Economic Analysis for regional price parity and cost-of-living comparisons by state
- Bureau of Labor Statistics Consumer Expenditure Survey for household spending patterns by income group
- A Kaggle company compensation dataset for additional company-level comparisons
## Important data limitations
The available datasets do not measure every aspect of the pay gap in exactly the same way. In particular:
- Companies define their own median employee, which can include part-time or non-U.S. workers.
- Some datasets report pay ratios but not CEO compensation in dollar amounts.
- Cost-of-living data is available by state and year, while company headquarters may not represent where most employees live.
- Household spending data for the highest income group is used as an estimate for executive spending patterns; it does not represent CEOs directly.
- Detailed executive compensation data is available for only a limited sample of companies.
We present these limitations alongside the visualizations so that viewers can interpret the comparisons appropriately.
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
