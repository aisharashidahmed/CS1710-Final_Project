# Raw data

Original files, kept unchanged. `npm run clean` reads from here.

- `ceo_data_pay_merged_sp500.csv`: Kaggle copy of AFL-CIO Executive Paywatch. 492 S&P 500 companies, fiscal year 2021.
  - Columns: unnamed row index, ticker, company_name, median_worker_pay, pay_ratio, ceo_name, salary, industry.
  - `salary` is the CEO's total pay, not base salary.
  - Money and ratios are stored as text ("$25,670,673", "1,013:1"), and `industry` uses `%20` for spaces.

## `epi/`: Economic Policy Institute, State of Working America Data Library (data version 2026.9.22)

National, yearly tables. `npm run clean:history` writes `static/data/history.csv` (pay ratio and union membership, 1965–2024) and `static/data/productivity.csv` (productivity vs. pay, 1948–2024).

- `ceo_pay_ratio.csv`: U.S. CEO-to-worker pay ratio, 1965–2025. We use the "realized" measure (stock options counted when cashed in). EPI uses the 350 largest U.S. firms, so its ratio is higher than our S&P 500 median.
- `historical_union_membership.csv`: share of workers who are union members, 1917–2024.
- `union_wage_premium.csv`: how much more union workers earn than similar non-union workers, 2003–2024 (12.8% overall in 2024). Quoted in the text, not charted.
- `productivity_and_pay_indexes.csv`: productivity (net output per hour of work) and a typical worker's hourly pay plus benefits, adjusted for inflation, as indexes with 1948 = 100. We use the yearly rows ("base = 1948"), 1948–2024.

## `profits_2021.csv`: company profit and employees (gathered by hand from SEC filings)

54 well-known S&P 500 companies from our dataset. For each: net income (GAAP, attributable to the company; for banks, applicable to common stock) and year-end employees from the company's annual report (10-K) on SEC EDGAR. The fiscal year always matches our pay data, checked by matching the median worker pay in the company's proxy statement. For companies whose year ends mid-year (Costco, Microsoft, Oracle, Walgreens, P&G, Tyson, Visa, Nike, FedEx), that is the fiscal year ending in 2022.

`npm run clean:profits` joins it with `companies.csv` and writes `static/data/profits.csv`. It keeps only companies whose workforce is mostly in the U.S., and whose employee count covers the workers behind the median pay. Left out: franchises (McDonald's, Yum!, Domino's), mostly non-U.S. workforces (Coca-Cola, PepsiCo, P&G, Pfizer, Visa, Oracle), and hotels (Marriott, Hilton). The reasons are listed in `scripts/clean-profits.js`.

Employee counts are each company's own figure: most are rounded "approximately" headcounts that include part-time workers; a few are full-time or full-time equivalents (Apple, Microsoft, Netflix, Oracle, Verizon, Comcast, Delta).
