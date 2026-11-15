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
			<text class="hover-label" x={hx + (flip ? -8 : 8)} y={unionPanel.top + 4} text-anchor={flip ? 'end' : 'start'}>
				{hovered.year}: {share(hovered.unionShare)} in a union
			</text>
		{/if}
	</svg>
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
