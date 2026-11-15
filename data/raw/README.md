# Raw data

Original files, kept unchanged. `npm run clean` reads from here.

- `ceo_data_pay_merged_sp500.csv`: Kaggle copy of AFL-CIO Executive Paywatch. 492 S&P 500 companies, fiscal year 2021.
  - Columns: unnamed row index, ticker, company_name, median_worker_pay, pay_ratio, ceo_name, salary, industry.
  - `salary` is the CEO's total pay, not base salary.
  - Money and ratios are stored as text ("$25,670,673", "1,013:1"), and `industry` uses `%20` for spaces.

## `epi/`: Economic Policy Institute, State of Working America Data Library (data version 2026.9.22)

National, yearly tables. `npm run clean:history` reads the first two and writes `static/data/history.csv` (1965–2024).

- `ceo_pay_ratio.csv`: U.S. CEO-to-worker pay ratio, 1965–2025. We use the "realized" measure (stock options counted when cashed in). EPI uses the 350 largest U.S. firms, so its ratio is higher than our S&P 500 median.
- `historical_union_membership.csv`: share of workers who are union members, 1917–2024.
- `union_wage_premium.csv`: how much more union workers earn than similar non-union workers, 2003–2024 (12.8% overall in 2024). Quoted in the text, not charted.
