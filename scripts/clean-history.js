// Cleans EPI tables into two files the site loads. Run with: npm run clean:history
//   static/data/history.csv       pay ratio and union membership, 1965-2024 (Part 2: History)
//   static/data/productivity.csv  productivity vs. pay, 1948-2024 ("Where did the money go?")
import { readFileSync, writeFileSync } from 'node:fs';
import * as d3 from 'd3';

const RATIO = 'data/raw/epi/ceo_pay_ratio.csv';
const UNION = 'data/raw/epi/historical_union_membership.csv';
const OUT = 'static/data/history.csv';

// Years both tables cover.
const FIRST = 1965;
const LAST = 2024;

const read = (file) => d3.csvParse(readFileSync(file, 'utf8'));

// EPI has two ratios. "Realized" counts stock options when they are cashed in, which is what the CEO actually got.
const ratioByYear = new Map(
	read(RATIO)
		.filter((d) => d.measure === 'CEO-to-worker pay ratio, realized' && d.group_value === 'Overall')
		.map((d) => [+d.year, +d.value])
);

// Share of all wage and salary workers who are union members (0.104 = 10.4%).
const unionByYear = new Map(
	read(UNION)
		.filter((d) => d.measure === 'Share in a union' && d.group_value === 'Overall')
		.map((d) => [+d.year, +d.value])
);

const rows = [];
for (let year = FIRST; year <= LAST; year++) {
	const ratio = ratioByYear.get(year);
	const union = unionByYear.get(year);
	if (ratio == null || union == null) throw new Error(`Missing data for ${year}`);
	rows.push({
		year,
		pay_ratio: Math.round(ratio * 10) / 10,
		union_share: Math.round(union * 1000) / 10 // percent, 1 decimal
	});
}

writeFileSync(OUT, d3.csvFormat(rows) + '\n');
console.log(`Wrote ${rows.length} years (${FIRST}–${LAST}) to ${OUT}`);

// ---- Productivity vs. pay, 1948-2024 ----
// Both are indexes with 1948 = 100. "Net productivity" = output per hour of work across the economy;
// "Total compensation per hour" = a typical worker's hourly pay plus benefits, adjusted for inflation.
const PRODUCTIVITY = 'data/raw/epi/productivity_and_pay_indexes.csv';
const OUT_PRODUCTIVITY = 'static/data/productivity.csv';
const PROD_FIRST = 1948;

const indexByYear = d3.rollup(
	read(PRODUCTIVITY).filter(
		(d) => d.measure === 'Productivity and pay real index, base = 1948' && d.date_interval === 'year'
	),
	(v) => Object.fromEntries(v.map((d) => [d.group_value, +d.value])),
	(d) => +d.year
);

const prodRows = [];
for (let year = PROD_FIRST; year <= LAST; year++) {
	const d = indexByYear.get(year);
	const productivity = d?.['Net productivity (output per hour)'];
	const pay = d?.['Total compensation per hour'];
	if (productivity == null || pay == null) throw new Error(`Missing productivity data for ${year}`);
	prodRows.push({
		year,
		productivity: Math.round(productivity * 10) / 10,
		pay: Math.round(pay * 10) / 10
	});
}

writeFileSync(OUT_PRODUCTIVITY, d3.csvFormat(prodRows) + '\n');
console.log(`Wrote ${prodRows.length} years (${PROD_FIRST}–${LAST}) to ${OUT_PRODUCTIVITY}`);
