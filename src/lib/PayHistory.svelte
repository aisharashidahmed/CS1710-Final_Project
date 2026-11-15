<script>
	import * as d3 from 'd3';

	// Two stacked line charts on one shared timeline, 1965–2024 (EPI data, see scripts/clean-history.js):
	// the U.S. CEO-to-worker pay ratio on top, the share of workers in a union below.
	// Hovering either one marks the same year on both.
	// history = [{ year, payRatio, unionShare }] from loadHistory() in #lib/data.js.
	let { history } = $props();

	const width = 760;
	const margin = { top: 30, right: 30, bottom: 36, left: 56 };
	const left = margin.left;
	const right = width - margin.right;

	// Panel heights, top to bottom. The gap leaves room for the second panel's title.
	const ratioPanel = { top: margin.top, bottom: 250 };
	const unionPanel = { top: 300, bottom: 440 };
	const height = unionPanel.bottom + margin.bottom;

	const x = d3
		.scaleLinear()
		.domain(d3.extent(history, (d) => d.year))
		.range([left, right]);

	// Both linear on purpose: the size of the climb and the drop is the point, and log scales would flatten them.
	const yRatio = d3.scaleLinear().domain([0, 450]).range([ratioPanel.bottom, ratioPanel.top]);
	const yUnion = d3.scaleLinear().domain([0, 30]).range([unionPanel.bottom, unionPanel.top]);

	const ratioLine = d3
		.line()
		.x((d) => x(d.year))
		.y((d) => yRatio(d.payRatio));
	const unionLine = d3
		.line()
		.x((d) => x(d.year))
		.y((d) => yUnion(d.unionShare));

	const byYear = new Map(history.map((d) => [d.year, d]));
	const ratioCallouts = [1965, 2000, 2021].map((year) => byYear.get(year));
	const unionCallouts = [1965, 2000, 2024].map((year) => byYear.get(year));

	// Why the big dips happened. Most CEO pay is stock, so it falls when the stock market falls
	// (EPI, "CEO pay declined in 2023", 2024). Tagged at the bottom of each dip; hover shows the reason.
	const dips = [
		{ year: 2002, label: 'Dot-com crash', why: 'Stock market crash after 2000' },
		{ year: 2009, label: 'Financial crisis', why: '2008 financial crisis and stock crash' },
		{ year: 2023, label: 'Stock drop, fewer options', why: '2022 stock drop, then fewer stock options' }
	].map((d) => ({ ...d, point: byYear.get(d.year) }));
	const reasons = new Map([
		[2001, dips[0].why],
		[2002, dips[0].why],
		[2008, dips[1].why],
		[2009, dips[1].why],
		[2022, dips[2].why],
		[2023, dips[2].why]
	]);

	// Laws about CEO pay, marked with numbered badges and explained in the key under the chart.
	// dy staggers badges that would touch (2009 and 2010 are one year apart).
	const laws = [
		{ n: 1, year: 1993, dy: 0 },
		{ n: 2, year: 2002, dy: 0 },
		{ n: 3, year: 2009, dy: 0 },
		{ n: 4, year: 2010, dy: 18 }
	];

	const ratio = (v) => `${Math.round(v)} to 1`;
	const share = (v) => `${v.toFixed(1)}%`;
	// Callouts at the left edge start at their dot; the rest center on it.
	const anchor = (d) => (d.year === 1965 ? 'start' : d.year >= 2021 ? 'end' : 'middle');

	let xAxisG = $state();
	let yRatioG = $state();
	let yUnionG = $state();
	$effect(() => {
		d3.select(xAxisG).call(d3.axisBottom(x).ticks(8).tickFormat(d3.format('d')));
		d3.select(yRatioG).call(
			d3
				.axisLeft(yRatio)
				.ticks(5)
				.tickFormat((v) => `${v}:1`)
		);
		d3.select(yUnionG).call(
			d3
				.axisLeft(yUnion)
				.ticks(3)
				.tickFormat((v) => `${v}%`)
		);
	});

	// Hover: the year nearest the mouse, shown on both panels.
	let svg;
	let hovered = $state(null);
	function onmove(event) {
		const [mx] = d3.pointer(event, svg);
		const [first, last] = x.domain();
		hovered = byYear.get(Math.max(first, Math.min(last, Math.round(x.invert(mx))))) ?? null;
	}
</script>

<div class="chart">
	<svg
		viewBox="0 0 {width} {height}"
		bind:this={svg}
		role="img"
		aria-label="CEO-to-worker pay ratio and union membership, 1965 to 2024"
		onmousemove={onmove}
		onmouseleave={() => (hovered = null)}
	>
		<!-- Laws: dashed lines with numbered badges, drawn first so the data sits on top. -->
		{#each laws as l (l.n)}
			{@const lx = x(l.year)}
			<line class="law-line" x1={lx} x2={lx} y1={ratioPanel.top + l.dy + 7} y2={unionPanel.bottom} />
			<circle class="law-badge" cx={lx} cy={ratioPanel.top + l.dy} r="8" />
			<text class="law-number" x={lx} y={ratioPanel.top + l.dy} dominant-baseline="central">{l.n}</text>
		{/each}

		<!-- Top panel: pay ratio -->
		<text class="panel-title ratio-title" x={left} y={14}>CEO-to-worker pay ratio</text>
		{#each yRatio.ticks(5) as t (t)}
			<line class="grid" x1={left} x2={right} y1={yRatio(t)} y2={yRatio(t)} />
		{/each}
		<path class="ratio-line" d={ratioLine(history)} />
		{#each ratioCallouts as d (d.year)}
			<circle class="ratio-dot" cx={x(d.year)} cy={yRatio(d.payRatio)} r="4" />
			<text class="callout ratio-text" x={x(d.year)} y={yRatio(d.payRatio) - 10} text-anchor={anchor(d)}>
				{d.year}: {ratio(d.payRatio)}
			</text>
		{/each}
		{#each dips as d (d.year)}
			{@const dx = x(d.year)}
			{@const dy = yRatio(d.point.payRatio)}
			<line class="dip-tick" x1={dx} x2={dx} y1={dy + 6} y2={dy + 18} />
			<text class="dip-label" x={dx} y={dy + 32} text-anchor={d.year > 2020 ? 'end' : 'middle'}>
				↓ {d.label}
			</text>
		{/each}
		<g bind:this={yRatioG} transform="translate({left}, 0)" />

		<!-- Bottom panel: union membership -->
		<text class="panel-title union-title" x={left} y={unionPanel.top - 16}>
			Share of U.S. workers in a union
		</text>
		{#each yUnion.ticks(3) as t (t)}
			<line class="grid" x1={left} x2={right} y1={yUnion(t)} y2={yUnion(t)} />
		{/each}
		<path class="union-line" d={unionLine(history)} />
		{#each unionCallouts as d (d.year)}
			<circle class="union-dot" cx={x(d.year)} cy={yUnion(d.unionShare)} r="4" />
			<text class="callout union-text" x={x(d.year)} y={yUnion(d.unionShare) - 10} text-anchor={anchor(d)}>
				{d.year}: {share(d.unionShare)}
			</text>
		{/each}
		<g bind:this={yUnionG} transform="translate({left}, 0)" />

		<g bind:this={xAxisG} transform="translate(0, {unionPanel.bottom})" />

		<!-- The hovered year, marked on both panels. -->
		{#if hovered}
			{@const hx = x(hovered.year)}
			{@const flip = hx > right - 150}
			<line class="hover-line" x1={hx} x2={hx} y1={ratioPanel.top} y2={unionPanel.bottom} />
			<circle class="hover-dot" cx={hx} cy={yRatio(hovered.payRatio)} r="6" />
			<circle class="hover-dot" cx={hx} cy={yUnion(hovered.unionShare)} r="6" />
			<text class="hover-label" x={hx + (flip ? -8 : 8)} y={ratioPanel.top + 4} text-anchor={flip ? 'end' : 'start'}>
				{hovered.year}: {ratio(hovered.payRatio)}
			</text>
			{#if reasons.has(hovered.year)}
				<text class="hover-why" x={hx + (flip ? -8 : 8)} y={ratioPanel.top + 22} text-anchor={flip ? 'end' : 'start'}>
					{reasons.get(hovered.year)}
				</text>
			{/if}
			<text class="hover-label" x={hx + (flip ? -8 : 8)} y={unionPanel.top + 4} text-anchor={flip ? 'end' : 'start'}>
				{hovered.year}: {share(hovered.unionShare)} in a union
			</text>
		{/if}
	</svg>
	<ol class="laws">
		<li>
			<strong>1993: $1 million cap.</strong> Companies can no longer deduct CEO salary above $1 million
			from their taxes, but pay tied to performance, like stock options, is exempt. Companies can still
			pay CEOs as much as they want in stock options, and the ratio climbs fastest in the years after.
		</li>
		<li>
			<strong>2002: Sarbanes-Oxley Act.</strong> Stricter accounting rules after the Enron scandal.
		</li>
		<li>
			<strong>2009: Bailout pay limits.</strong> Banks that took federal bailout money (TARP) face
			limits on executive pay. Only bailed-out companies are covered.
		</li>
		<li>
			<strong>2010: Dodd-Frank Act.</strong> Shareholders get a vote on CEO pay, and companies must
			report their CEO-to-worker pay ratio (first reports in 2018). The data on this page comes from
			those reports.
		</li>
	</ol>
	<p class="note">
		<strong>Did these laws cause the dips? No.</strong> Stock crashes did. Most CEO pay is company
		stock, so it falls when stocks fall. Each dip began before the nearby law passed.
	</p>
</div>

<style>
	svg {
		width: 100%;
		height: auto;
		display: block;
	}
	.grid {
		stroke: #e4dccd;
	}
	.ratio-line,
	.union-line {
		fill: none;
		stroke-width: 3;
	}
	/* Purple = a ratio, blue = workers (the site's color story). */
	.ratio-line {
		stroke: var(--company-dark);
	}
	.union-line {
		stroke: var(--worker);
	}
	.ratio-dot,
	.ratio-text,
	.ratio-title {
		fill: var(--company-dark);
	}
	.union-dot,
	.union-text,
	.union-title {
		fill: var(--worker);
	}
	.callout {
		font-size: 13px;
		font-weight: 700;
	}
	.panel-title {
		font-size: 14px;
		font-weight: 700;
	}
	.dip-tick {
		stroke: #555;
		stroke-width: 1.5;
	}
	.dip-label {
		font-size: 12px;
		font-weight: 600;
		fill: #555;
	}
	.hover-why {
		font-size: 13px;
		fill: #333;
		paint-order: stroke;
		stroke: var(--bg);
		stroke-width: 4px;
		pointer-events: none;
	}
	.law-line {
		stroke: #9a8f7c;
		stroke-dasharray: 2 4;
	}
	.law-badge {
		fill: var(--sector-dark);
	}
	.law-number {
		font-size: 11px;
		font-weight: 700;
		fill: #fff;
		text-anchor: middle;
	}
	.laws {
		margin: 0.75rem 0 0;
		padding-left: 1.5rem;
		font-size: 0.95rem;
	}
	.laws li {
		margin-bottom: 0.3rem;
	}
	.note {
		margin: 0.5rem 0 0;
		font-size: 0.95rem;
		color: #555;
	}
	.hover-line {
		stroke: #111;
		stroke-dasharray: 3 3;
		pointer-events: none;
	}
	.hover-dot {
		fill: none;
		stroke: #111;
		stroke-width: 2;
		pointer-events: none;
	}
	.hover-label {
		font-size: 14px;
		font-weight: 700;
		fill: #111;
		paint-order: stroke;
		stroke: var(--bg);
		stroke-width: 4px;
		pointer-events: none;
	}
</style>
