<script>
	import * as d3 from 'd3';
	import { money, ratioLabel } from '#lib/data.js';

	// Detail view for one clicked company (or null).
	let { company = null } = $props();

	// A work year is 260 days (52 weeks x 5 days).
	const WORKDAYS_PER_YEAR = 260;

	// Workdays and work hours for the CEO to earn the median worker's yearly pay
	// (computed by scripts/clean.js).
	let days = $derived(company?.workdays ?? 0);
	let timeLabel = $derived(
		days >= 1
			? `${d3.format('.1f')(days)} workdays`
			: `${d3.format('.1f')(company?.workHours ?? 0)} work hours`
	);

	const barWidth = 300;
</script>

<div class="card">
	{#if company}
		<h3>{company.company}</h3>
		<p class="big">{timeLabel}</p>
		<p>
			is how long it took CEO {company.ceo} to earn what the company's median worker earns in a full
			year (<span class="worker">{money(company.workerPay)}</span>).
		</p>

		<!-- One bar = one work year (260 days). The red sliver is the CEO's time. -->
		<svg viewBox="0 0 {barWidth} 34">
			<rect x="0" y="4" width={barWidth} height="16" fill="var(--worker)" opacity="0.25" />
			<rect x="0" y="4" width={Math.max(2, (days / WORKDAYS_PER_YEAR) * barWidth)} height="16" fill="var(--ceo)" />
			<text x="0" y="32">Jan 1</text>
			<text x={barWidth} y="32" text-anchor="end">Dec 31 (worker's full year)</text>
		</svg>

		<p class="small">
			Pay ratio {ratioLabel(company.ratio)}: the median worker would need about
			<strong>{d3.format(',')(Math.round(company.ratio))} years</strong> to earn the CEO's pay for one
			year.
		</p>
	{:else}
		<p class="empty">Click a dot to see how long its CEO takes to earn a worker's yearly pay.</p>
	{/if}
</div>

<style>
	.card {
		background: #fff;
		border: 1px solid #ddd;
		border-radius: 6px;
		padding: 12px 14px;
		min-height: 120px;
	}
	h3 {
		margin: 0;
		font-size: 16px;
	}
	.big {
		margin: 6px 0 0;
		font-size: 26px;
		font-weight: bold;
		color: var(--ceo);
	}
	p {
		margin: 4px 0;
		font-size: 14px;
	}
	.small,
	.empty {
		font-size: 13px;
		color: #555;
	}
	svg {
		width: 100%;
		max-width: 360px;
		display: block;
		margin: 6px 0;
	}
	text {
		font-size: 10px;
		fill: #555;
	}
</style>
