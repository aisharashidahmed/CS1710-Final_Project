// Cleans two EPI tables into static/data/history.csv, which the "How did we get here?" section loads.
// Run with: npm run clean:history
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
