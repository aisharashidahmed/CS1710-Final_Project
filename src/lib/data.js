import * as d3 from 'd3';
import { asset } from '$app/paths';

// Cleaned by scripts/clean.js (npm run clean). Numbers are already numbers.
export async function loadCompanies() {
	return d3.csv(asset('/data/companies.csv'), parseRow);
}

export function parseRow(d) {
	return {
		ticker: d.ticker,
		company: d.company,
		ceo: d.ceo,
		sector: d.sector,
		// CEO's total compensation, not base salary.
		ceoPay: +d.ceo_pay,
		workerPay: +d.worker_pay,
		ratio: +d.pay_ratio,
		workdays: +d.workdays,
		workHours: +d.work_hours,
		startYear: +d.start_year,
		belowPoverty: d.below_poverty === 'true',
		ceoPayRank: +d.ceo_pay_rank,
		ratioRank: +d.ratio_rank
	};
}

// Sectors from highest to lowest median pay ratio (computed on the full dataset,
// so the order stays the same while views are filtered).
export function sectorOrder(companies) {
	return d3
		.sort(
			d3.rollups(companies, (v) => d3.median(v, (d) => d.ratio), (d) => d.sector),
			(a, b) => d3.descending(a[1], b[1])
		)
		.map((d) => d[0]);
}

export const money = d3.format('$,.0f');
export const moneyShort = (n) => d3.format('$.3s')(n).replace('G', 'B');
export const ratioLabel = (r) => `${d3.format(',')(Math.round(r))}:1`;
