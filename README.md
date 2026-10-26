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
## Project status (Milestone 8, Prototype I)
The site is one scrolling story page that follows our Milestone 7 storyboard:

| Section | Status |
|---|---|
| Hook: live counter of Amazon CEO vs. median worker pay | Working |
| Pyramid timeline | Planned (placeholder) |
| Sector bar chart + company dot plot (hover links, click filters) | Working D3 chart |
| CEO vs. worker pay scatterplot + workdays card (click a company) | Working D3 chart |
| Slope chart: CEO pay rank vs. pay ratio rank | Planned (placeholder) |
| Below-the-poverty-line callout | Planned (placeholder) |
| Most vs. least equal company in each sector | Planned (placeholder) |
| Pay receipt (novel view) | Planned (placeholder) |
| Take action | Text |

The current prototype uses one dataset: the Kaggle copy of AFL-CIO Executive Paywatch (492 S&P 500 companies, fiscal year 2021). The other sources above may be added in later milestones.

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
npm run clean
```

`scripts/clean.js` reads `data/raw/ceo_data_pay_merged_sp500.csv` and writes `static/data/companies.csv`, which the site loads. It:
- turns text money and ratios ("$25,670,673", "1,013:1") into numbers
- fixes sector names (`Consumer%20Discretionary` → `Consumer Discretionary`)
- renames `salary` to `ceo_pay` (the column holds total CEO pay, not base salary)
- drops rows with missing values (none in the current file)
- adds `workdays` and `work_hours` (time for the CEO to earn the median worker's yearly pay), `start_year` (2021 − pay ratio; negative = BCE), `below_poverty` (median worker pay under the 2021 poverty line of $26,500 for a family of four), `ceo_pay_rank` and `ratio_rank`

## Project structure
```
data/raw/              original data, unchanged
scripts/clean.js       data cleaning (npm run clean)
static/data/           cleaned data loaded by the site
src/routes/+page.svelte  the story page and shared chart state
src/lib/               charts and helpers
  data.js              loads companies.csv, formatting helpers
  Hook.svelte          live pay counter
  SectorBars.svelte    sector bar chart
  CompanyStrip.svelte  company dot plot
  PayScatter.svelte    CEO vs. worker pay scatterplot
  WorkdaysCard.svelte  workdays detail for a clicked company
  Tooltip.svelte       hover details
  Placeholder.svelte   boxes for charts not built yet
```
