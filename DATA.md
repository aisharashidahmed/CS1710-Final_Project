# Data dictionary

Every file the site loads is in `static/data/`. Each one is made by a script in `scripts/` from the original files in `data/raw/`. The original files are never changed. `data/raw/README.md` describes where each one came from.

```sh
npm run clean           # companies.csv
npm run clean:history   # history.csv and productivity.csv
npm run clean:profits   # profits.csv (run npm run clean first)
npm run clean:necessities  # necessities.csv
```

## `companies.csv`: one row per company (492 rows)

Source: AFL-CIO Executive Paywatch, Kaggle copy (`data/raw/ceo_data_pay_merged_sp500.csv`). S&P 500 companies, pay disclosed in proxy statements filed in 2022 ("fiscal year 2021"). Made by `scripts/clean.js`.

| Field | Type | Meaning |
|---|---|---|
| `ticker` | text | Stock ticker, e.g. `AMZN` |
| `company` | text | Company name |
| `ceo` | text | CEO's name |
| `sector` | text | One of 11 S&P 500 sectors, e.g. `Consumer Discretionary` |
| `ceo_pay` | dollars | CEO's **total** pay for the year (salary, bonus, stock, options and other pay). The raw column is called `salary`, but it is total pay. |
| `worker_pay` | dollars | Pay of the company's median worker (half the workforce earns more, half less), as the company reported it |
| `pay_ratio` | number | CEO pay ÷ median worker pay, as reported (2 to 6,474) |
| `workdays` | number | Workdays the CEO needs to earn the median worker's yearly pay (a year = 260 workdays) |
| `work_hours` | number | The same in work hours (a year = 2,080 hours) |
| `start_year` | year | 2021 − pay ratio: the year the median worker would have had to start working to earn the CEO's one-year pay. Negative = BCE. There is no year 0, so BCE years are moved back one more year (Amazon: −4454 = 4454 BCE). |
| `below_poverty` | true/false | `true` if `worker_pay` is under $26,500, the 2021 federal poverty guideline for a family of four |
| `ceo_pay_rank` | number | 1 = highest CEO pay |
| `ratio_rank` | number | 1 = highest pay ratio |

Caveat: each company chooses its own median employee, who can be part-time or outside the U.S. This explains some extreme ratios.

## `history.csv`: one row per year, 1965–2024 (60 rows)

Source: Economic Policy Institute, State of Working America Data Library (`data/raw/epi/`). Made by `scripts/clean-history.js`.

| Field | Type | Meaning |
|---|---|---|
| `year` | year | Calendar year |
| `pay_ratio` | number | U.S. CEO-to-worker pay ratio at the 350 largest U.S. firms, "realized" measure (stock options counted when cashed in) |
| `union_share` | percent | Share of U.S. workers who are union members, e.g. `27.6` = 27.6% |

Caveat: EPI's ratio is higher than our S&P 500 median (408:1 vs. 190:1 in 2021) because it uses the largest 350 firms and a different method. The site never mixes the two in one chart.

## `productivity.csv`: one row per year, 1948–2024 (77 rows)

Source: Economic Policy Institute, productivity and pay indexes (`data/raw/epi/productivity_and_pay_indexes.csv`). Made by `scripts/clean-history.js`.

| Field | Type | Meaning |
|---|---|---|
| `year` | year | Calendar year |
| `productivity` | index | Net output per hour of work across the U.S. economy. 1948 = 100. |
| `pay` | index | A typical worker's hourly pay plus benefits, adjusted for inflation. 1948 = 100. |

## `profits.csv`: one row per company (43 rows)

Source: each company's annual report (10-K) on SEC EDGAR, gathered by hand (`data/raw/profits_2021.csv`, 54 companies), joined with `companies.csv`. Made by `scripts/clean-profits.js`.

| Field | Type | Meaning |
|---|---|---|
| `ticker` | text | Stock ticker |
| `company` | text | Company name |
| `fiscal_year_end` | date | Last day of the fiscal year used. It always matches the year of the pay data (checked by matching the median worker pay in the company's proxy). For companies whose year ends mid-year, it ends in 2022. |
| `net_income` | dollars | Net income (profit) for the year, attributable to the company. For banks, net income applicable to common stock. |
| `employees` | number | Employees at year end, worldwide, as the 10-K states it. Most include part-time workers; a few are full-time or full-time equivalents (Apple, Microsoft, Netflix, Verizon, Comcast, Delta). |
| `median_worker_pay` | dollars | From `companies.csv` |
| `ceo_pay` | dollars | From `companies.csv` |
| `note` | text | A caveat shown next to the company in the chart (only Berkshire Hathaway has one) |

Left out of `profits.csv` (reasons in `scripts/clean-profits.js`): franchise companies whose employee counts miss franchise workers (McDonald's, Yum! Brands, Domino's), companies with most workers outside the U.S. (Coca-Cola, PepsiCo, P&G, Pfizer, Visa, Oracle), and hotels (Marriott, Hilton).

## `necessities.csv`: one row per household income group (5 rows)

Source: Bureau of Labor Statistics, Consumer Expenditure Survey 2021, Table 1101 "Quintiles of income before taxes" (`data/raw/bls/cu-income-quintiles-before-taxes-2021.xlsx`, typed into `data/raw/bls/necessities_2021.csv`). Made by `scripts/clean-necessities.js`. All amounts are averages per U.S. household ("consumer unit") per year.

| Field | Type | Meaning |
|---|---|---|
| `quintile` | number | Income group: 1 = lowest 20% of households, 5 = highest 20% |
| `lower_limit` | dollars | Income where the group starts (0 for the lowest group) |
| `income_mean` | dollars | Average income before taxes in the group |
| `food` | dollars | Average yearly spending on food |
| `housing` | dollars | Average yearly spending on housing |
| `transportation` | dollars | Average yearly spending on transportation |
| `healthcare` | dollars | Average yearly spending on health care |
| `necessities` | dollars | food + housing + transportation + healthcare |

Caveat: these are household averages, and a household can have more than one earner, so comparing them with one worker's pay is an estimate. The highest group (incomes from $129,534) is the closest the data gets to a CEO.
