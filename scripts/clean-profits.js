// Cleans the hand-gathered profit data into static/data/profits.csv for the profit-sharing chart.
// Run with: npm run clean:profits (run npm run clean first, since it joins companies.csv).
//
// data/raw/profits_2021.csv holds every company we looked up: net income and year-end employees
// from each company's annual report (10-K) on SEC EDGAR. The fiscal
// year always matches the pay data (checked by matching the median worker pay in the proxy).
import { readFileSync, writeFileSync } from 'node:fs';
import * as d3 from 'd3';

const RAW = 'data/raw/profits_2021.csv';
const COMPANIES = 'static/data/companies.csv';
const OUT = 'static/data/profits.csv';

// Left out of the chart, and why. The site is about U.S. worker pay, so we keep only companies
// whose workforce is mostly in the U.S. And the chart splits a company's profit across ITS
// employees, so the employee count must cover the workers behind the median pay.
const EXCLUDE = {
	MCD: "Franchise: over 2 million franchise restaurant workers aren't in its 200,000 employees",
	YUM: "Franchise: franchise restaurant workers aren't in its employee count",
	DPZ: "Franchise: franchise store workers aren't in its employee count",
	KO: 'Mostly outside the U.S.: about 12% of employees are in the U.S.; the median worker is in the UK',
	MAR: 'Hotels: staff at hotels it manages for owners are not counted',
	HLT: 'Hotels: counts managed-hotel staff, unlike Marriott, so hotel counts are not comparable',
	// Most workers outside the U.S., per the company's own 10-K.
	PEP: 'Mostly outside the U.S.: about 129,000 of 309,000 employees are in the U.S.',
	PG: 'Mostly outside the U.S.: about 26% of employees are in the U.S.',
	PFE: 'Mostly outside the U.S.: about 29,000 of 79,000 employees are in the U.S.',
	V: 'Mostly outside the U.S.: about 46% of employees are in the U.S.',
	ORCL: 'Mostly outside the U.S.: about 48,000 of 143,000 employees are in the U.S.'
};

// Shown next to the company in the chart.
const NOTES = {
	'BRK.B':
		"Berkshire's profit includes large gains on the stocks it owns, not only what its businesses earned."
};

const companies = new Map(d3.csvParse(readFileSync(COMPANIES, 'utf8')).map((d) => [d.ticker, d]));
const raw = d3.csvParse(readFileSync(RAW, 'utf8'));

const rows = [];
for (const d of raw) {
	if (EXCLUDE[d.ticker]) continue;
	const c = companies.get(d.ticker);
	if (!c) throw new Error(`${d.ticker} is not in ${COMPANIES}`);
	const netIncome = +d.net_income_usd;
	const employees = +d.employees_total;
	if (!employees) throw new Error(`${d.ticker} has no employee count`);
	rows.push({
		ticker: d.ticker,
		company: c.company,
		fiscal_year_end: d.fiscal_year_end,
		net_income: netIncome,
		employees,
		median_worker_pay: +c.worker_pay,
		ceo_pay: +c.ceo_pay,
		note: NOTES[d.ticker] ?? ''
	});
}

rows.sort((a, b) => d3.ascending(a.company, b.company));
writeFileSync(OUT, d3.csvFormat(rows) + '\n');
console.log(`Wrote ${rows.length} companies to ${OUT} (left out: ${Object.keys(EXCLUDE).join(', ')})`);
