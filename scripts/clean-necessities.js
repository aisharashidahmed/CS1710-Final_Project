// Cleans BLS household spending on basic needs into static/data/necessities.csv for Part 5.
// Run with: npm run clean:necessities
//
// data/raw/bls/necessities_2021.csv holds the 5 income groups (quintiles), typed in by hand from
// data/raw/bls/cu-income-quintiles-before-taxes-2021.xlsx (BLS Consumer Expenditure Survey 2021,
// Table 1101, the "Mean" rows). quintile 1 = lowest 20% of households, 5 = highest 20%.
import { readFileSync, writeFileSync } from 'node:fs';
import * as d3 from 'd3';

const RAW = 'data/raw/bls/necessities_2021.csv';
const OUT = 'static/data/necessities.csv';

const rows = d3.csvParse(readFileSync(RAW, 'utf8'), d3.autoType).map((d) => ({
	...d,
	// Basic needs = housing + food + transportation + health care, in dollars per year.
	necessities: d.food + d.housing + d.transportation + d.healthcare
}));

if (rows.length !== 5) throw new Error(`Expected 5 income groups, got ${rows.length}`);
writeFileSync(OUT, d3.csvFormat(rows) + '\n');
console.log(`Wrote ${rows.length} income groups to ${OUT}`);
