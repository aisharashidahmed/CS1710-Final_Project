# Raw data

Original files, kept unchanged. `npm run clean` reads from here.

- `ceo_data_pay_merged_sp500.csv`: Kaggle copy of AFL-CIO Executive Paywatch. 492 S&P 500 companies, fiscal year 2021.
  - Columns: unnamed row index, ticker, company_name, median_worker_pay, pay_ratio, ceo_name, salary, industry.
  - `salary` is the CEO's total pay, not base salary.
  - Money and ratios are stored as text ("$25,670,673", "1,013:1"), and `industry` uses `%20` for spaces.
