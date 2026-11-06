// Calculations for the pay receipt. Pure functions, so they can be checked with plain Node.

export const REFERENCE_YEAR = 2021;
const DAY_MS = 86400000;

const ok = (n) => Number.isFinite(n) && n > 0;

// Returns null when any figure is missing, zero, negative or not finite.
export function receiptNumbers(c) {
	if (!c || !ok(c.ceoPay) || !ok(c.workerPay)) return null;
	// Derived ratio: annual CEO pay / annual median worker pay.
	const ratio = c.ceoPay / c.workerPay;
	if (!ok(ratio)) return null;
	// Calendar time: pay spread evenly over a 365-day year.
	const elapsedMs = (365 * DAY_MS) / ratio;
	// UTC moment in the reference year when the CEO passed one median worker's year of pay.
	const moment = new Date(Date.UTC(REFERENCE_YEAR, 0, 1) + elapsedMs);
	// Worker-years needed to earn the CEO's one-year pay, rounded to whole years.
	const workerYears = Math.round(ratio);
	return {
		ratio,
		reportedRatio: ok(c.ratio) ? c.ratio : null,
		elapsedMs,
		moment,
		workerYears,
		startYear: startYear(workerYears)
	};
}

// Year a worker would have had to start (counting back from the reference year).
// No year 0: 1 BCE is followed by 1 CE. Returns a signed astronomical-free label year.
export function startYear(years) {
	let y = REFERENCE_YEAR - years;
	if (y <= 0) y -= 1;
	return y;
}

export function yearLabel(y) {
	return y < 0 ? `${(-y).toLocaleString('en-US')} BCE` : `${y} CE`;
}

export function durationLabel(ms) {
	if (!Number.isFinite(ms) || ms < 0) return '—';
	const s = ms / 1000;
	const fmt = (n, unit) => `${n < 10 ? n.toFixed(1) : Math.round(n).toLocaleString('en-US')} ${unit}`;
	if (s < 60) return fmt(s, 'seconds');
	if (s < 3600) return fmt(s / 60, 'minutes');
	if (s < 86400) return fmt(s / 3600, 'hours');
	return fmt(s / 86400, 'days');
}

export function momentLabel(date) {
	if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '—';
	const d = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
	const t = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', timeZone: 'UTC' });
	return `${d}, ${t} UTC`;
}
