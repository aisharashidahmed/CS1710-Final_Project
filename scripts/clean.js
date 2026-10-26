// Cleans the raw Kaggle file into static/data/companies.csv, which the site loads.
// Run with: npm run clean
import { readFileSync, writeFileSync } from 'node:fs';
import * as d3 from 'd3';

const RAW = 'data/raw/ceo_data_pay_merged_sp500.csv';
const OUT = 'static/data/companies.csv';

// Fiscal year the pay was reported for.
const YEAR = 2021;
// A full-time year: 52 weeks x 5 days, 8 hours a day.
const WORKDAYS_PER_YEAR = 260;
const WORK_HOURS_PER_YEAR = 2080;
// 2021 federal poverty guideline for a family of four.
const POVERTY_LINE = 26500;

// Money is text ("$25,670,673") and the ratio is text ("1,013:1").
function toNumber(text) {
	return +String(text).replace(/[$,]/g, '').split(':')[0];
}

const raw = d3.csvParse(readFileSync(RAW, 'utf8'));

let companies = raw.map((d) => ({
	ticker: d.ticker,
	company: d.company_name,
	ceo: d.ceo_name,
	sector: decodeURIComponent(d.industry),
	// The raw column is called "salary" but it holds the CEO's TOTAL compensation.
	ceo_pay: toNumber(d.salary),
	worker_pay: toNumber(d.median_worker_pay),
	pay_ratio: toNumber(d.pay_ratio)
}));

// Drop rows missing any number we need.
const before = companies.length;
companies = companies.filter((d) => d.ceo_pay > 0 && d.worker_pay > 0 && d.pay_ratio > 0);

for (const d of companies) {
	// Time the CEO needs to earn the median worker's yearly pay.
	d.workdays = +(WORKDAYS_PER_YEAR / d.pay_ratio).toFixed(3);
	d.work_hours = +(WORK_HOURS_PER_YEAR / d.pay_ratio).toFixed(3);
	// Year the median worker would have had to start working to earn the CEO's one-year pay
	// (negative = BCE). Amazon: 2021 - 6474 = -4453, i.e. 4453 BCE.
	d.start_year = YEAR - d.pay_ratio;
	d.below_poverty = d.worker_pay < POVERTY_LINE;
}

// Ranks for the slope chart: 1 = highest CEO pay / highest ratio.
d3.sort(companies, (d) => -d.ceo_pay).forEach((d, i) => (d.ceo_pay_rank = i + 1));
d3.sort(companies, (d) => -d.pay_ratio).forEach((d, i) => (d.ratio_rank = i + 1));

companies = d3.sort(companies, (d) => d.ratio_rank);
writeFileSync(OUT, d3.csvFormat(companies));

console.log(`Read ${before} rows, kept ${companies.length}, wrote ${OUT}`);
console.log(`Sectors: ${new Set(companies.map((d) => d.sector)).size}`);
console.log(`Below poverty line: ${companies.filter((d) => d.below_poverty).length}`);
console.log(`Median work hours: ${d3.median(companies, (d) => d.work_hours).toFixed(1)}`);
