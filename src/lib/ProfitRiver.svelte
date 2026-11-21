<script>
	import * as d3 from 'd3';
	import { Tween } from 'svelte/motion';
	import CompanySearch from '#lib/CompanySearch.svelte';
	import { money, moneyShort } from '#lib/data.js';
	import { DURATION, easing } from '#lib/motion.js';

	// "What if a company shared its profit with its workers?" (our Q6), drawn as a river, after our
	// Sketch 15 (money flowing in streams) and Sketch 2 (profit -> per worker -> a bump on the
	// median worker's pay). The company's 2021 profit splits into a stream it keeps and a stream
	// shared with workers; the shared amount is divided equally among all employees and added to
	// the median worker's pay.
	// data = [{ ticker, company, netIncome, employees, workerPay, ceoPay, note }] from loadProfits().
	let { data } = $props();

	// $state.raw keeps the plain company object, so the search box can match it.
	let picked = $state.raw(data.find((d) => d.ticker === 'AMZN') ?? data[0]);
	let sharePct = $state(10);

	// The share eases to its new value, so the streams widen and narrow smoothly.
	const share = Tween.of(() => sharePct / 100, { duration: DURATION, easing });

	// ---- The math (all in dollars, nothing rounded until it's shown) ----
	let profit = $derived(Math.max(0, picked.netIncome));
	let hasProfit = $derived(picked.netIncome > 0);
	let sharedTotal = $derived(profit * (sharePct / 100)); // profit given to workers
	let keptTotal = $derived(profit - sharedTotal); // profit the company keeps
	let perWorker = $derived(sharedTotal / picked.employees); // equal split among every employee
	let newPay = $derived(picked.workerPay + perWorker); // the median worker's pay plus their share
	let raisePct = $derived(perWorker / picked.workerPay);
	let ceoPerWorker = $derived(picked.ceoPay / picked.employees);

	// ---- Layout ----
	const width = 780;
	const height = 350;
	const pool = { x: 20, w: 80, top: 60, h: 220 };
	const streamEnd = 360;
	// The streams spread apart by this much at their ends, and never go past it, so nothing is cut off.
	const spread = 22;
	const bar = { x: 690, w: 52, top: 40, bottom: 300 };

	// Stream widths are the pool's height split by the (eased) share: width is proportional to dollars.
	let sharedH = $derived(pool.h * share.current);
	let keptH = $derived(pool.h - sharedH);
	let keptEndTop = pool.top - spread;
	let sharedEndBottom = pool.top + pool.h + spread;

	// A band that curves from one vertical span (x0, top0..bot0) to another (x1, top1..bot1).
	function band(x0, top0, bot0, x1, top1, bot1) {
		const xm = (x0 + x1) / 2;
		return `M${x0},${top0} C${xm},${top0} ${xm},${top1} ${x1},${top1} L${x1},${bot1} C${xm},${bot1} ${xm},${bot0} ${x0},${bot0} Z`;
	}
	// The center line of the same curve, for the flowing marks.
	function curve(x0, y0, x1, y1) {
		const xm = (x0 + x1) / 2;
		return `M${x0},${y0} C${xm},${y0} ${xm},${y1} ${x1},${y1}`;
	}

	const poolRight = pool.x + pool.w;
	let splitY = $derived(pool.top + keptH);
	let keptPath = $derived(band(poolRight, pool.top, splitY, streamEnd, keptEndTop, keptEndTop + keptH));
	let keptMid = $derived(keptEndTop + keptH / 2);
	let keptFlow = $derived(curve(poolRight, pool.top + keptH / 2, streamEnd, keptMid));
	let sharedPath = $derived(
		band(poolRight, splitY, pool.top + pool.h, streamEnd, sharedEndBottom - sharedH, sharedEndBottom)
	);
	let sharedMid = $derived(sharedEndBottom - sharedH / 2);
	let sharedFlow = $derived(curve(poolRight, splitY + sharedH / 2, streamEnd, sharedMid));

	// Pay bar: a true dollar scale starting at $0, fixed per company (up to the pay if ALL profit
	// were shared), so the raise segment is exactly proportional to the dollars added.
	let yPay = $derived(
		d3
			.scaleLinear()
			.domain([0, picked.workerPay + profit / picked.employees])
			.nice()
			.range([bar.bottom, bar.top])
	);
	let baseTop = $derived(yPay(picked.workerPay));
	let raiseTop = $derived(yPay(newPay));

	let payAxisG = $state();
	$effect(() => {
		d3.select(payAxisG).call(
			d3
				.axisLeft(yPay)
				.ticks(4)
				.tickFormat((v) => (v === 0 ? '$0' : moneyShort(v)))
		);
	});

	// Flowing marks: thicker in a wider stream, like more water.
	const flowWidth = (h) => Math.max(1.5, Math.min(9, h * 0.08));
	const showMoney = (v) => (v === 0 ? '$0' : moneyShort(v));
</script>

<div class="controls">
	<CompanySearch {data} label="Pick a company" selected={picked} onpick={(d) => (picked = d)} />
	<div class="slider">
		<label for="profit-share">
			Share of 2021 profit given to workers: <strong>{sharePct}%</strong>
		</label>
		<input
			id="profit-share"
			type="range"
			min="0"
			max="100"
			step="1"
			bind:value={sharePct}
			style:--fill="{sharePct}%"
		/>
		<div class="ticks" aria-hidden="true"><span>0%</span><span>50%</span><span>100%</span></div>
	</div>
</div>

<div class="chart">
	<svg viewBox="0 0 {width} {height}" role="img" aria-label="Where {picked.company}'s 2021 profit would go">
		<!-- The profit pool -->
		<text class="pool-label" x={pool.x + pool.w / 2} y={pool.top - 30}>2021 profit</text>
		<text class="pool-amount" x={pool.x + pool.w / 2} y={pool.top - 10}>
			{hasProfit ? moneyShort(profit) : 'None'}
		</text>
		<rect class="pool" x={pool.x} y={pool.top} width={pool.w} height={pool.h} rx="6" />

		{#if hasProfit}
			<!-- Kept by the company -->
			{#if keptH > 0.5}
				<path class="kept" d={keptPath} />
				<path class="flow" d={keptFlow} style:stroke-width={flowWidth(keptH)} />
			{/if}
			<text class="label kept-text" x={streamEnd + 12} y={keptMid - 4}>
				Kept by the company: {showMoney(keptTotal)}
			</text>
			<text class="sub" x={streamEnd + 12} y={keptMid + 14}>{100 - sharePct}% of profit</text>

			<!-- Shared with workers -->
			{#if sharedH > 0.5}
				<path class="shared" d={sharedPath} />
				<path class="flow" d={sharedFlow} style:stroke-width={flowWidth(sharedH)} />
			{/if}
			<text class="label worker-text" x={streamEnd + 12} y={sharedMid - 22}>
				Shared with workers: {showMoney(sharedTotal)}
			</text>
			<text class="sub" x={streamEnd + 12} y={sharedMid - 4}>
				÷ {d3.format(',')(picked.employees)} workers
			</text>
			<text class="label worker-text" x={streamEnd + 12} y={sharedMid + 16}>
				= {money(perWorker)} each
			</text>

			<!-- Each worker's share flows into the median worker's pay -->
			{#if perWorker > 0}
				<path class="flow to-bar" d={curve(streamEnd + 205, sharedMid + 10, bar.x - 4, (raiseTop + baseTop) / 2)} />
			{/if}
		{:else}
			<text class="dry" x={poolRight + 20} y={pool.top + pool.h / 2}>
				{picked.company} had no profit to share in 2021.
			</text>
		{/if}

		<!-- The median worker's pay on a dollar axis from $0, with the raise on top -->
		<g bind:this={payAxisG} transform="translate({bar.x - 8}, 0)" class="pay-axis" />
		<rect class="pay-base" x={bar.x} y={baseTop} width={bar.w} height={bar.bottom - baseTop} />
		{#if perWorker > 0}
			<rect class="pay-raise" x={bar.x} y={raiseTop} width={bar.w} height={baseTop - raiseTop} />
		{/if}
		<text class="bar-title" x={bar.x + bar.w / 2} y={bar.bottom + 20}>Median worker's pay</text>
		<text class="bar-old" x={bar.x + bar.w / 2} y={bar.bottom + 38}>{money(picked.workerPay)} now</text>
		<!-- The new pay and the raise, right above the bar, so big raises stand out. -->
		<text class="bar-new" x={bar.x + bar.w / 2} y={raiseTop - 24}>{money(newPay)}</text>
		<text class="bar-raise" x={bar.x + bar.w / 2} y={raiseTop - 7}>
			+{d3.format(',.1f')(raisePct * 100)}%
		</text>
	</svg>
</div>

<p class="result">
	With <strong>{sharePct}%</strong> of profit shared, the median worker's pay goes from
	<span class="worker">{money(picked.workerPay)}</span> to
	<span class="worker">{money(newPay)}</span>, a
	<strong>{d3.format(',.1f')(raisePct * 100)}%</strong> raise.
</p>
<p class="compare">
	Sharing the CEO's <strong>entire</strong> pay instead would give each worker only
	<span class="ceo">{money(ceoPerWorker)}</span>.
</p>
{#if picked.note}
	<p class="note">Note: {picked.note}</p>
{/if}

<style>
	.controls {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: 0.75rem 2.5rem;
		margin-bottom: 0.5rem;
	}
	.slider {
		flex: 1 1 300px;
		max-width: 460px;
	}
	.slider label {
		display: block;
		margin-bottom: 0.4rem;
	}
	.slider strong {
		color: var(--worker);
	}

	/* A custom slider: a rounded track, blue up to the chosen share, and a round handle. */
	input[type='range'] {
		-webkit-appearance: none;
		appearance: none;
		width: 100%;
		height: 10px;
		margin: 0.5rem 0;
		border-radius: 999px;
		background: linear-gradient(
			to right,
			var(--worker) 0%,
			var(--worker) var(--fill),
			var(--card) var(--fill),
			var(--card) 100%
		);
		box-shadow: inset 0 0 0 1px #d8cdb9;
		cursor: pointer;
	}
	input[type='range']::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 24px;
		height: 24px;
		border: 3px solid var(--worker);
		border-radius: 50%;
		background: var(--bg);
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
	}
	input[type='range']::-moz-range-thumb {
		width: 18px;
		height: 18px;
		border: 3px solid var(--worker);
		border-radius: 50%;
		background: var(--bg);
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
	}
	input[type='range']:focus-visible {
		outline: 2px solid var(--company-dark);
		outline-offset: 4px;
	}
	.ticks {
		display: flex;
		justify-content: space-between;
		font-size: 0.8rem;
		color: #777;
	}

	svg {
		width: 100%;
		height: auto;
		display: block;
	}
	/* Purple = the company's money, blue = workers (the site's color story). */
	.pool {
		fill: var(--company-dark);
	}
	.kept {
		fill: var(--company);
		opacity: 0.75;
	}
	.shared {
		fill: var(--worker);
		opacity: 0.8;
	}
	/* The flowing marks: short dashes that drift downstream, like water. */
	.flow {
		fill: none;
		stroke: rgba(255, 255, 255, 0.55);
		stroke-linecap: round;
		stroke-dasharray: 2 16;
		animation: flow 1.2s linear infinite;
		pointer-events: none;
	}
	.flow.to-bar {
		stroke: var(--worker);
		stroke-width: 3;
		stroke-dasharray: 4 10;
	}
	@keyframes flow {
		to {
			stroke-dashoffset: -18;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.flow {
			animation: none;
		}
	}
	.pay-base {
		fill: var(--worker-tint);
		stroke: var(--worker);
	}
	.pay-raise {
		fill: var(--worker);
	}
	.pay-axis :global(text) {
		font-size: 11px;
	}
	text {
		text-anchor: middle;
	}
	.label,
	.sub,
	.dry {
		text-anchor: start;
	}
	.pool-label,
	.bar-title {
		font-size: 13px;
		font-weight: 600;
		fill: #333;
	}
	.pool-amount {
		font-size: 18px;
		font-weight: 700;
		fill: var(--company-dark);
	}
	.label {
		font-size: 14px;
		font-weight: 700;
	}
	.sub {
		font-size: 13px;
		fill: #555;
	}
	.kept-text {
		fill: var(--company-dark);
	}
	.worker-text {
		fill: var(--worker);
	}
	.bar-old {
		font-size: 13px;
		fill: #333;
	}
	.bar-new {
		font-size: 17px;
		font-weight: 700;
		fill: var(--worker);
	}
	.bar-raise {
		font-size: 15px;
		font-weight: 700;
		fill: var(--worker);
	}
	.dry {
		font-size: 15px;
		fill: #555;
	}
	.result {
		margin-bottom: 0.25rem;
		font-size: 1.1rem;
	}
	.compare {
		margin-top: 0;
	}
	.note {
		font-size: 0.9rem;
		color: #555;
	}
</style>
