import * as d3 from 'd3';
import { asset } from '$app/paths';

// Cleaned by scripts/clean.js (npm run clean). Numbers are already numbers.
export async function loadCompanies() {
	return d3.csv(asset('/data/companies.csv'), parseRow);
}

// U.S. history, 1965–2024, cleaned by scripts/clean-history.js (npm run clean:history).
// payRatio = EPI CEO-to-worker pay ratio; unionShare = percent of workers in a union.
export async function loadHistory() {
	return d3.csv(asset('/data/history.csv'), (d) => ({
		year: +d.year,
		payRatio: +d.pay_ratio,
		unionShare: +d.union_share
	}));
}

// Productivity vs. pay, 1948–2024, both indexes with 1948 = 100 (scripts/clean-history.js).
export async function loadProductivity() {
	return d3.csv(asset('/data/productivity.csv'), (d) => ({
		year: +d.year,
		productivity: +d.productivity,
		pay: +d.pay
	}));
}

// Profit and employees for 43 companies (scripts/clean-profits.js), for the profit-sharing river.
export async function loadProfits() {
	return d3.csv(asset('/data/profits.csv'), (d) => ({
		ticker: d.ticker,
		company: d.company,
		fiscalYearEnd: d.fiscal_year_end,
		netIncome: +d.net_income,
		employees: +d.employees,
		workerPay: +d.median_worker_pay,
		ceoPay: +d.ceo_pay,
		note: d.note
	}));
}

// Household spending on basic needs by income group (BLS 2021, scripts/clean-necessities.js), for Part 5.
export async function loadNecessities() {
	return d3.csv(asset('/data/necessities.csv'), (d) => ({
		quintile: +d.quintile,
		lowerLimit: +d.lower_limit,
		incomeMean: +d.income_mean,
		food: +d.food,
		housing: +d.housing,
		transportation: +d.transportation,
		healthcare: +d.healthcare,
		necessities: +d.necessities
	}));
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

// Plain examples of what each sector contains (S&P's GICS sectors), for readers who don't know the names.
export const SECTOR_EXAMPLES = {
	'Communication Services': 'phone and internet companies, media, video games',
	'Consumer Discretionary': 'retail, restaurants, travel, cars',
	'Consumer Staples': 'groceries, household goods, drinks',
	Energy: 'oil and gas',
	Financials: 'banks, insurance, investing',
	'Health Care': 'drug makers, hospitals, medical devices, health insurance',
	Industrials: 'airlines, machinery, defense, shipping',
	'Information Technology': 'software, chips, computers',
	Materials: 'chemicals, mining, packaging',
	'Real Estate': 'property owners and landlords',
	Utilities: 'electricity, gas, water'
};

export const money = d3.format('$,.0f');
export const moneyShort = (n) => d3.format('$.3s')(n).replace('G', 'B');
export const ratioLabel = (r) => `${d3.format(',')(Math.round(r))}:1`;
