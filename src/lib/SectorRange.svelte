<script>
	import * as d3 from 'd3';
	import Tooltip from '#lib/Tooltip.svelte';
	import { money, ratioLabel, SECTOR_EXAMPLES } from '#lib/data.js';

	// Dumbbell plot: one row per sector, a dot at the company with the lowest and the highest
	// CEO-to-worker pay ratio, joined by a line. Pick a sector to compare its two companies.
	// data = every company, order = sectors from highest to lowest median ratio.
	let { data, order } = $props();

	const width = 900;
	const rowH = 38;
	const margin = { top: 34, right: 150, bottom: 46, left: 190 };
	const valid = (d) =>
		Number.isFinite(d.ratio) && d.ratio > 0 && Number.isFinite(d.ceoPay) && Number.isFinite(d.workerPay);

	// Lowest and highest ratio per sector. Ties keep every tied company (shown together).
	let rows = $derived(
		order.map((sector) => {
			const v = data.filter((d) => d.sector === sector && valid(d));
			if (!v.length) return { sector, count: 0, low: [], high: [] };
			const lo = d3.min(v, (d) => d.ratio);
			const hi = d3.max(v, (d) => d.ratio);
			return {
				sector,
				count: v.length,
				low: v.filter((d) => d.ratio === lo),
				high: v.filter((d) => d.ratio === hi)
			};
		})
	);

	let height = $derived(margin.top + rows.length * rowH + margin.bottom);

	// Log scale: ratios run from 2:1 to 6,474:1. One shared scale for every sector.
	let x = $derived(
		d3
			.scaleLog()
			.domain([1, 10000])
			.range([margin.left, width - margin.right])
	);
	let y = $derived(
		d3
			.scaleBand()
			.domain(rows.map((r) => r.sector))
			.range([margin.top, height - margin.bottom])
			.padding(0.3)
	);

	let selected = $state(null);
	let current = $derived(rows.find((r) => r.sector === (selected ?? rows[0]?.sector)));
	$effect(() => {
		if (!selected && rows.length) selected = rows[0].sector;
	});

	let xAxisG = $state();
	$effect(() => {
		d3.select(xAxisG).call(
			d3
				.axisBottom(x)
				.tickValues([1, 10, 100, 1000, 10000])
				.tickFormat((d) => `${d3.format(',')(d)}:1`)
		);
	});

	let wrapper;
	let tip = $state(null);
	let hovered = $state.raw(null);

	function showTip(event, company, kind) {
		hovered = company;
		const box = wrapper.getBoundingClientRect();
		const target = event.currentTarget.getBoundingClientRect();
		const px = Number.isFinite(event.clientX) && event.clientX ? event.clientX - box.left : target.left - box.left + target.width / 2;
		const py = Number.isFinite(event.clientY) && event.clientY ? event.clientY - box.top : target.top - box.top + target.height / 2;
		tip = { company, x: px, y: py, flip: px > box.width - 250, extra: `${kind} CEO-to-worker pay ratio in its sector` };
	}
	function clearTip() {
		hovered = null;
		tip = null;
	}

	const names = (list) => list.map((d) => d.company).join(' / ');
	const shortName = (list) => {
		const n = list[0].company.replace(/,? (Inc\.|Corporation|Company|Incorporated|plc|Plc|Group, Inc\.)$/, '');
		return list.length > 1 ? `${n} +${list.length - 1}` : n;
	};
	const dim = (r) => (selected && r.sector !== selected ? 0.35 : 1);
</script>

<div class="sector-range">
	<div class="controls">
		<label for="sector-pick">Compare a sector:</label>
		<select id="sector-pick" bind:value={selected}>
			{#each rows as r (r.sector)}
				<option value={r.sector}>{r.sector}</option>
			{/each}
		</select>
		<span class="legend">
			<span class="dot low"></span> lowest CEO-to-worker pay ratio
			<span class="dot high"></span> highest CEO-to-worker pay ratio
		</span>
	</div>

	<div class="chart" bind:this={wrapper} style="position: relative">
		<svg
			viewBox="0 0 {width} {height}"
			role="img"
			aria-labelledby="sr-title sr-desc"
		>
			<title id="sr-title">Lowest and highest CEO-to-worker pay ratio in each sector</title>
			<desc id="sr-desc">
				{rows
					.filter((r) => r.count)
					.map((r) => `${r.sector}: ${names(r.low)} ${ratioLabel(r.low[0].ratio)} to ${names(r.high)} ${ratioLabel(r.high[0].ratio)}`)
					.join('. ')}
			</desc>

			{#each x.ticks(4).filter((t) => [10, 100, 1000].includes(t)) as t}
				<line class="grid" x1={x(t)} x2={x(t)} y1={margin.top - 6} y2={height - margin.bottom} />
			{/each}

			{#each rows as r (r.sector)}
				{@const cy = y(r.sector) + y.bandwidth() / 2}
				<g opacity={dim(r)} class="row">
					<!-- Whole row is a click target for picking the sector. -->
					<rect
						class="hit"
						x="0"
						y={y(r.sector) - 4}
						width={width}
						height={y.bandwidth() + 8}
						fill={r.sector === selected ? 'var(--card)' : 'transparent'}
						role="button"
						tabindex="-1"
						aria-label="Compare {r.sector}"
						onclick={() => (selected = r.sector)}
						onkeydown={() => {}}
					/>
					<text class="sector" x={margin.left - 14} y={cy} dominant-baseline="middle">{r.sector}</text>
					{#if r.count}
						{@const lo = r.low[0].ratio}
						{@const hi = r.high[0].ratio}
						<line class="bar" x1={x(lo)} x2={x(hi)} y1={cy} y2={cy} />
						{@const lowText = `${shortName(r.low)} ${ratioLabel(lo)}`}
						<!-- If the label would run into the sector names, put it above the dot instead. -->
						{#if x(lo) - 9 - lowText.length * 6.6 < margin.left}
							<text class="end-label" x={x(lo) - 6} y={cy - 11}>{lowText}</text>
						{:else}
							<text class="end-label left" x={x(lo) - 9} y={cy} dominant-baseline="middle">{lowText}</text>
						{/if}
						<text class="end-label" x={x(hi) + 9} y={cy} dominant-baseline="middle">
							{ratioLabel(hi)} {shortName(r.high)}
						</text>
						{#each [[r.low, 'Lowest', 'low'], [r.high, 'Highest', 'high']] as [list, kind, cls]}
							{#if !(cls === 'high' && r.count === 1)}
								<circle
									class="dot-mark {cls}"
									cx={x(list[0].ratio)}
									{cy}
									r="7"
									stroke={list.includes(hovered) ? '#111' : 'none'}
									stroke-width="2"
									tabindex="0"
									role="button"
									aria-label="{kind} ratio in {r.sector}: {names(list)}, {ratioLabel(list[0].ratio)}"
									onmouseenter={(e) => showTip(e, list[0], kind)}
									onmousemove={(e) => showTip(e, list[0], kind)}
									onmouseleave={clearTip}
									onfocus={(e) => ((selected = r.sector), showTip(e, list[0], kind))}
									onblur={clearTip}
									onclick={() => (selected = r.sector)}
									onkeydown={(e) => e.key === 'Enter' && (selected = r.sector)}
								/>
							{/if}
						{/each}
					{:else}
						<text class="end-label" x={margin.left} y={cy} dominant-baseline="middle">No valid data</text>
					{/if}
				</g>
			{/each}

			<g bind:this={xAxisG} transform="translate(0, {height - margin.bottom})" />
			<text class="axis-label" x={(margin.left + width - margin.right) / 2} y={height - 8}>
				CEO-to-worker pay ratio (log scale: each step is 10× larger)
			</text>
		</svg>
		<Tooltip {tip} />
	</div>

	<p class="note">
		The axis uses a log scale because ratios run from 2:1 to 6,474:1; on a regular scale most dots
		would pile up at the left edge. All figures are for fiscal year 2021.
	</p>

	{#if current?.count}
		{@const lo = current.low[0]}
		{@const hi = current.high[0]}
		<div class="detail" aria-live="polite">
			<h3>{current.sector} <span class="examples">({SECTOR_EXAMPLES[current.sector]})</span></h3>
			<div class="pair">
				{#each [[current.low, 'Lowest', 'low'], [current.high, 'Highest', 'high']] as [list, kind, cls]}
					{#if !(cls === 'high' && current.count === 1)}
						{#each list as c (c.ticker)}
							<div class="card {cls}">
								<p class="kind">{kind} CEO-to-worker pay ratio</p>
								<h4>{c.company}</h4>
								<p class="ratio">{ratioLabel(c.ratio)}</p>
								<dl>
									<dt>CEO total pay ({c.ceo})</dt>
									<dd class="ceo">{money(c.ceoPay)}</dd>
									<dt>Median worker pay</dt>
									<dd class="worker">{money(c.workerPay)}</dd>
									<dt>Reporting year</dt>
									<dd>Fiscal year 2021</dd>
								</dl>
							</div>
						{/each}
					{/if}
				{/each}
			</div>
			{#if current.count === 1}
				<p class="small">This sector has only one company with complete data, so there is nothing to compare.</p>
			{:else}
				<p class="takeaway">
					In {current.sector}, the highest ratio is
					<strong>{d3.format(',.0f')(hi.ratio / lo.ratio)}×</strong> the lowest. Both companies report
					for the same year and sector, yet their gaps differ widely. This chart shows the difference;
					it does not show what causes it.
				</p>
			{/if}
			<p class="small">
				Source: AFL-CIO Executive Paywatch (Kaggle copy), from companies' 2021 SEC proxy filings.
				Ratios are as reported by each company; each company picks its own median employee
				(sometimes part-time or outside the U.S.). This compares pay only, not overall fairness.
			</p>
		</div>
	{/if}
</div>

<style>
	.controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 0.75rem;
		margin: 1rem 0 0.5rem;
		font-size: 0.95rem;
	}
	label {
		font-weight: 600;
	}
	select {
		padding: 0.35rem 0.5rem;
		border: 1px solid #bbb;
		border-radius: 6px;
		background: var(--card);
		font: inherit;
	}
	select:focus-visible,
	circle:focus-visible {
		outline: 2px solid var(--company-dark);
		outline-offset: 2px;
	}
	.legend {
		color: #555;
		font-size: 0.85rem;
	}
	.legend .dot {
		display: inline-block;
		width: 10px;
		height: 10px;
		margin: 0 0.2rem 0 0.6rem;
		border-radius: 50%;
		vertical-align: middle;
	}
	.low {
		background: var(--company);
		fill: var(--company);
	}
	.high {
		background: var(--company-dark);
		fill: var(--company-dark);
	}
	svg {
		width: 100%;
		height: auto;
		display: block;
	}
	.hit {
		cursor: pointer;
		outline: none;
	}
	.grid {
		stroke: #ddd;
		stroke-dasharray: 3 3;
	}
	.bar {
		stroke: var(--sector);
		stroke-width: 3;
	}
	.dot-mark {
		cursor: pointer;
	}
	.sector {
		font-size: 14px;
		text-anchor: end;
		fill: #222;
	}
	.end-label {
		font-size: 12px;
		fill: #333;
		pointer-events: none;
	}
	.end-label.left {
		text-anchor: end;
	}
	.axis-label {
		font-size: 13px;
		text-anchor: middle;
		fill: #333;
	}
	.note,
	.small {
		font-size: 0.85rem;
		color: #555;
	}
	.detail {
		margin-top: 1rem;
		padding: 1rem 1.25rem;
		border-left: 3px solid var(--company-dark);
		background: var(--card);
		border-radius: 0 8px 8px 0;
	}
	h3 {
		margin: 0 0 0.75rem;
	}
	.examples {
		font-size: 0.9rem;
		font-weight: normal;
		color: #666;
	}
	.pair {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 1rem;
	}
	.card {
		padding: 0.75rem 1rem;
		border-radius: 6px;
		background: var(--bg);
		border-top: 5px solid var(--company);
	}
	.card.high {
		border-top-color: var(--company-dark);
	}
	.card h4 {
		margin: 0.1rem 0;
		font-size: 1.05rem;
		overflow-wrap: anywhere;
	}
	.kind {
		margin: 0;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #666;
	}
	.ratio {
		margin: 0.2rem 0 0.4rem;
		font-size: 1.8rem;
		font-weight: 700;
		color: var(--company-dark);
	}
	dl {
		display: grid;
		grid-template-columns: auto auto;
		gap: 0.15rem 0.75rem;
		margin: 0;
		font-size: 0.9rem;
	}
	dt {
		color: #555;
	}
	dd {
		margin: 0;
		text-align: right;
		font-variant-numeric: tabular-nums;
	}
	.takeaway {
		margin: 0.9rem 0 0.4rem;
	}
</style>
