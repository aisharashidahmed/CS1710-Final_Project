<script>
	import * as d3 from 'd3';
	import { tick } from 'svelte';
	import Tooltip from '#lib/Tooltip.svelte';
	import SectorRangeBars from '#lib/SectorRangeBars.svelte';
	import { DURATION } from '#lib/motion.js';
	import { money, ratioLabel, SECTOR_EXAMPLES } from '#lib/data.js';

	// Dumbbell plot: one row per sector, a dot at the company with the lowest and the highest
	// reported CEO-to-worker pay ratio, joined by a line. Pick a sector to compare its two companies.
	// data = every company, order = sectors from highest to lowest median ratio (same as the sector bars).
	let { data, order } = $props();

	const width = 900;
	const margin = { top: 30, right: 84, bottom: 56, left: 205 };
	const ROW = 38; // collapsed row
	const ROW_OPEN = 84; // selected row: room for two lines of company names under the dots
	const CY = 19; // dot line, measured from the top of a row
	const valid = (d) =>
		d &&
		Number.isFinite(d.ratio) &&
		d.ratio > 0 &&
		Number.isFinite(d.ceoPay) &&
		d.ceoPay > 0 &&
		Number.isFinite(d.workerPay) &&
		d.workerPay > 0;

	// Lowest and highest ratio per sector. Ties keep every tied company (shown together).
	let rows = $derived(
		(order ?? []).map((sector) => {
			const v = (data ?? []).filter((d) => d?.sector === sector && valid(d));
			if (!v.length) return { sector, count: 0, low: [], high: [] };
			const lo = d3.min(v, (d) => d.ratio);
			const hi = d3.max(v, (d) => d.ratio);
			return {
				sector,
				count: v.length,
				low: v.filter((d) => d.ratio === lo),
				high: lo === hi ? [] : v.filter((d) => d.ratio === hi)
			};
		})
	);

	let selected = $state(null);
	$effect(() => {
		if (rows.length && !rows.some((r) => r.sector === selected)) selected = rows[0].sector;
	});
	let current = $derived(rows.find((r) => r.sector === selected));

	// Rows stack top to bottom; the selected one is taller. Total height never changes.
	let layout = $derived.by(() => {
		let top = margin.top;
		return rows.map((r) => {
			const h = r.sector === selected ? ROW_OPEN : ROW;
			const row = { ...r, top, h };
			top += h;
			return row;
		});
	});
	let plotBottom = $derived(margin.top + rows.length * ROW + (ROW_OPEN - ROW));
	let height = $derived(plotBottom + margin.bottom);

	// Log scale: ratios run from 2:1 to 6,474:1. One shared scale for every sector.
	let x = $derived(
		d3
			.scaleLog()
			.domain([1, 10000])
			.range([margin.left, width - margin.right])
	);

	let xAxisG = $state();
	$effect(() => {
		d3.select(xAxisG).call(
			d3
				.axisBottom(x)
				.tickValues([1, 10, 100, 1000, 10000])
				.tickFormat((d) => `${d3.format(',')(d)}:1`)
		);
	});

	// Label helpers. Widths are estimates (12px sans), used only to keep labels in bounds.
	const textW = (s, px = 12) => s.length * px * 0.6;
	const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
	const names = (list) => list.map((d) => d.company).join(' / ');
	const shortName = (list) => {
		const n = list[0].company.replace(/,? (Inc\.|Corporation|Company|Incorporated|plc|Plc|Group, Inc\.|& Co\.)$/, '');
		return list.length > 1 ? `${n} +${list.length - 1} tied` : n;
	};

	// Tooltip
	let wrapper;
	let tip = $state(null);
	let hovered = $state.raw(null);
	function showTip(event, company, kind) {
		hovered = company;
		const box = wrapper.getBoundingClientRect();
		const target = event.currentTarget.getBoundingClientRect();
		const fromMouse = Number.isFinite(event.clientX) && event.clientX;
		const px = (fromMouse ? event.clientX : target.left + target.width / 2) - box.left + wrapper.scrollLeft;
		const py = (fromMouse ? event.clientY : target.top + target.height / 2) - box.top;
		tip = { company, x: px, y: py, flip: px - wrapper.scrollLeft > box.width - 250, extra: `${kind} reported pay ratio in its sector` };
	}
	function clearTip() {
		hovered = null;
		tip = null;
	}

	// Keyboard: the rows form one radio group. Tab reaches the selected row; arrow keys move.
	let rowEls = $state([]);
	async function onRowKey(event, i) {
		const keys = { ArrowDown: i + 1, ArrowRight: i + 1, ArrowUp: i - 1, ArrowLeft: i - 1, Home: 0, End: rows.length - 1 };
		if (event.key === ' ' || event.key === 'Enter') {
			event.preventDefault();
			selected = rows[i].sector;
			return;
		}
		if (!(event.key in keys)) return;
		event.preventDefault();
		const next = (keys[event.key] + rows.length) % rows.length;
		selected = rows[next].sector;
		await tick();
		rowEls[next]?.focus();
	}

	// Data-driven takeaway: what differs between the two companies, in dollars. No causal claim.
	const times = (k) => (k < 10 ? d3.format('.1f')(k) : d3.format(',.0f')(k));
	// a = highest-ratio company's figure, b = lowest-ratio company's figure.
	function compare(a, b) {
		const k = a / b;
		if (k >= 1.1) return `${times(k)}× as much as`;
		if (k <= 1 / 1.1) return `only ${d3.format(k < 0.01 ? '.1%' : '.0%')(k)} of`;
		return `about the same as`;
	}
	let takeaway = $derived.by(() => {
		if (!current?.count || !current.high.length) return null;
		const lo = current.low[0];
		const hi = current.high[0];
		const L = shortName([lo]);
		const H = shortName([hi]);
		return {
			L,
			H,
			ceo: compare(hi.ceoPay, lo.ceoPay),
			worker: compare(hi.workerPay, lo.workerPay),
			fold: times(hi.ratio / lo.ratio),
			tied: current.low.length > 1 || current.high.length > 1
		};
	});

	// Detail panel items, lowest ratio first, in the same order in both bar panels.
	let items = $derived(
		current?.count
			? [...current.low.map((c) => ({ company: c, kind: 'low' })), ...current.high.map((c) => ({ company: c, kind: 'high' }))]
			: []
	);
</script>

<div class="sector-range" style:--duration="{DURATION}ms">
	<div class="controls">
		<label for="sector-pick">Choose a sector:</label>
		<select id="sector-pick" bind:value={selected}>
			{#each rows as r (r.sector)}
				<option value={r.sector}>{r.sector}</option>
			{/each}
		</select>
		<span class="legend" aria-hidden="true">
			<span class="dot low"></span> lowest reported ratio
			<span class="dot high"></span> highest reported ratio
		</span>
	</div>
	<p class="instruction">Select a row or choose a sector to compare its two companies.</p>

	<div class="chart" bind:this={wrapper} style="position: relative">
		<svg viewBox="0 0 {width} {height}" role="group" aria-labelledby="sr-title" aria-describedby="sr-desc">
			<title id="sr-title">Lowest and highest reported CEO-to-worker pay ratio in each sector</title>
			<desc id="sr-desc">
				{rows
					.filter((r) => r.count)
					.map((r) =>
						r.high.length
							? `${r.sector}: ${names(r.low)} ${ratioLabel(r.low[0].ratio)} to ${names(r.high)} ${ratioLabel(r.high[0].ratio)}`
							: `${r.sector}: ${names(r.low)} ${ratioLabel(r.low[0].ratio)}`
					)
					.join('. ')}
			</desc>

			{#each [10, 100, 1000] as t}
				<line class="grid" x1={x(t)} x2={x(t)} y1={margin.top - 6} y2={plotBottom} />
			{/each}

			<g role="radiogroup" aria-label="Sectors (use arrow keys to move)">
				{#each layout as r, i (r.sector)}
					{@const isSel = r.sector === selected}
					<g class="row" class:selected={isSel} style:transform="translate(0px, {r.top}px)">
						<!-- Whole row is a click / keyboard target for picking the sector. -->
						<rect
							bind:this={rowEls[i]}
							class="hit"
							x="4"
							y="1"
							width={width - 8}
							height={r.h - 2}
							rx="6"
							role="radio"
							aria-checked={isSel}
							aria-label="{r.sector}{r.count && r.high.length
								? `: ${ratioLabel(r.low[0].ratio)} to ${ratioLabel(r.high[0].ratio)}`
								: ''}"
							tabindex={isSel ? 0 : -1}
							onclick={() => (selected = r.sector)}
							onkeydown={(e) => onRowKey(e, i)}
						/>
						<text class="sector" x={margin.left - 18} y={CY} dominant-baseline="middle">{r.sector}</text>
						{#if r.count}
							{@const lo = r.low[0].ratio}
							{@const hi = r.high.length ? r.high[0].ratio : lo}
							{@const loText = ratioLabel(lo)}
							<line class="bar" x1={x(lo)} x2={x(hi)} y1={CY} y2={CY} />
							<!-- Ratio at each end. If the low label would reach the sector names, it sits above the dot. -->
							{#if x(lo) - 12 - textW(loText) < margin.left - 8}
								<text class="end-label" x={x(lo)} y={CY - 12} text-anchor="middle">{loText}</text>
							{:else}
								<text class="end-label" x={x(lo) - 12} y={CY} text-anchor="end" dominant-baseline="middle">{loText}</text>
							{/if}
							{#if r.high.length}
								<text class="end-label" x={x(hi) + 12} y={CY} dominant-baseline="middle">{ratioLabel(hi)}</text>
							{/if}

							<!-- Company names only on the selected row, on two lines so they never collide. -->
							{#if isSel}
								{@const lowLine = `Lowest: ${shortName(r.low)}`}
								<text class="name-label" x={clamp(x(lo) - 8, 12, width - 12 - textW(lowLine, 13))} y={CY + 27}>
									<tspan class="swatch low">●</tspan> {lowLine}
								</text>
								{#if r.high.length}
									{@const highLine = `Highest: ${shortName(r.high)}`}
									<text
										class="name-label"
										x={clamp(x(hi) + 8, 12 + textW(highLine, 13) + 16, width - 12)}
										y={CY + 47}
										text-anchor="end"
									>
										<tspan class="swatch high">●</tspan> {highLine}
									</text>
								{/if}
							{/if}

							{#each [[r.low, 'Lowest', 'low'], [r.high, 'Highest', 'high']] as [list, kind, cls]}
								{#if list.length}
									<circle
										class="dot-mark {cls}"
										cx={x(list[0].ratio)}
										cy={CY}
										r={isSel ? 8 : 6}
										stroke={list.includes(hovered) ? '#111' : isSel ? 'var(--sector-dark)' : 'none'}
										stroke-width={list.includes(hovered) ? 2.5 : 1.5}
										tabindex={isSel ? 0 : -1}
										role="button"
										aria-label="{kind} ratio in {r.sector}: {names(list)}, {ratioLabel(list[0].ratio)}"
										onmouseenter={(e) => showTip(e, list[0], kind)}
										onmousemove={(e) => showTip(e, list[0], kind)}
										onmouseleave={clearTip}
										onfocus={(e) => showTip(e, list[0], kind)}
										onblur={clearTip}
										onclick={() => (selected = r.sector)}
										onkeydown={(e) => e.key === 'Enter' && (selected = r.sector)}
									/>
								{/if}
							{/each}
						{:else}
							<text class="end-label" x={margin.left} y={CY} dominant-baseline="middle">No valid data</text>
						{/if}
					</g>
				{/each}
			</g>

			<g bind:this={xAxisG} transform="translate(0, {plotBottom + 4})" />
			<text class="axis-label" x={(margin.left + width - margin.right) / 2} y={height - 10}>
				Reported CEO-to-worker pay ratio (log scale)
			</text>
		</svg>
		<Tooltip {tip} />
	</div>

	<p class="note">
		<strong>Reading the axis:</strong> it uses a log scale, so each gridline is 10 times the one before
		(10:1, 100:1, 1,000:1). Equal distances mean equal multiples. A line's length shows how many times larger
		the highest ratio is than the lowest, not a dollar difference. Rows keep the order of the sector chart above.
	</p>

	{#if current}
		<div class="detail" aria-live="polite">
			<h3>{current.sector} <span class="examples">({SECTOR_EXAMPLES[current.sector] ?? 'sector'})</span></h3>
			{#if !current.count}
				<p class="small">No company in this sector has complete pay data.</p>
			{:else}
				<ul class="who">
					{#each items as d (d.company.ticker)}
						<li>
							<span class="dot {d.kind}" aria-hidden="true"></span>
							<span class="tag">{d.kind === 'low' ? 'Lowest' : 'Highest'} reported ratio</span>
							<span class="co">{d.company.company}</span>
							<span class="ratio">{ratioLabel(d.company.ratio)}</span>
						</li>
					{/each}
				</ul>
				{#if current.count === 1}
					<p class="small">This sector has only one company with complete data, so there is nothing to compare.</p>
				{:else if !current.high.length}
					<p class="small">Every company in this sector reports the same ratio.</p>
				{/if}

				<SectorRangeBars {items} field="ceoPay" title="CEO total compensation" cls="ceo" />
				<SectorRangeBars {items} field="workerPay" title="Median worker pay" cls="worker" />
				<p class="small scales">
					The two panels use different dollar scales (CEO pay is far larger). Compare bars within a panel,
					not across panels.
				</p>

				{#if takeaway}
					<p class="takeaway">
						<strong>What differs:</strong>
						{takeaway.H}'s CEO received <span class="ceo">{takeaway.ceo}</span> {takeaway.L}'s CEO, and
						{takeaway.H}'s median worker received <span class="worker">{takeaway.worker}</span>
						{takeaway.L}'s. Their reported ratios differ
						<strong>{takeaway.fold}-fold</strong>.{#if takeaway.tied}
							(Tied companies are listed above; this sentence uses the first of each.){/if}
						These figures describe the difference; they do not explain it. Job mix, location, part-time
						staff and stock awards can all play a part.
					</p>
				{/if}
			{/if}
			<p class="small">
				A sector is a broad group, so these two companies are not necessarily direct competitors. Source:
				AFL-CIO Executive Paywatch (Kaggle copy), from companies' fiscal year 2021 SEC proxy filings.
				Ratios are as reported by each company. Each company picks its own median employee (sometimes
				part-time or outside the U.S.), so ratios are not perfectly comparable. CEO total compensation
				includes stock awards, not just salary.
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
		margin: 1rem 0 0.25rem;
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
	select:focus-visible {
		outline: 2px solid var(--company-dark);
		outline-offset: 2px;
	}
	.instruction {
		margin: 0.25rem 0 0.5rem;
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--sector-dark);
	}
	.legend {
		color: #555;
		font-size: 0.85rem;
	}
	.dot {
		display: inline-block;
		width: 10px;
		height: 10px;
		margin: 0 0.2rem 0 0.6rem;
		border-radius: 50%;
		vertical-align: middle;
		flex: none;
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
	.row {
		transition: transform var(--duration) cubic-bezier(0.33, 1, 0.68, 1);
	}
	.hit {
		fill: transparent;
		cursor: pointer;
		outline: none;
	}
	.row:hover .hit {
		fill: color-mix(in srgb, var(--card) 50%, transparent);
	}
	.row.selected .hit {
		fill: var(--card);
	}
	/* Visible keyboard focus drawn on the SVG shape itself (outline is unreliable on SVG). */
	.hit:focus-visible {
		stroke: var(--company-dark);
		stroke-width: 2.5;
	}
	.dot-mark {
		cursor: pointer;
		outline: none;
	}
	.dot-mark:focus-visible {
		stroke: #111;
		stroke-width: 3;
	}
	.grid {
		stroke: #ddd;
		stroke-dasharray: 3 3;
	}
	.bar {
		stroke: var(--sector);
		stroke-width: 3;
		pointer-events: none;
	}
	.row.selected .bar {
		stroke: var(--sector-dark);
		stroke-width: 4;
	}
	.sector {
		font-size: 14px;
		text-anchor: end;
		fill: #222;
		pointer-events: none;
	}
	.row.selected .sector {
		font-weight: 700;
	}
	.end-label {
		font-size: 12px;
		fill: #333;
		pointer-events: none;
		font-variant-numeric: tabular-nums;
	}
	.row.selected .end-label {
		font-weight: 700;
		fill: var(--company-dark);
	}
	.name-label {
		font-size: 13px;
		fill: #222;
		pointer-events: none;
	}
	.swatch.low {
		fill: var(--company);
	}
	.swatch.high {
		fill: var(--company-dark);
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
		margin: 0 0 0.5rem;
	}
	.examples {
		font-size: 0.9rem;
		font-weight: normal;
		color: #666;
	}
	.who {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.who li {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.1rem 0.5rem;
		padding: 0.3rem 0;
		border-bottom: 1px solid rgba(0, 0, 0, 0.08);
	}
	.who .dot {
		margin: 0;
		align-self: center;
	}
	.tag {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #666;
	}
	.co {
		font-weight: 600;
		overflow-wrap: anywhere;
	}
	.ratio {
		margin-left: auto;
		font-weight: 700;
		color: var(--company-dark);
		font-variant-numeric: tabular-nums;
	}
	.scales {
		margin-top: 0.25rem;
	}
	.takeaway {
		margin: 0.9rem 0 0.4rem;
	}
</style>
