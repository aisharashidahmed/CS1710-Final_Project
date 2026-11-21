<script>
	import * as d3 from 'd3';

	// Productivity vs. pay, 1948–2024 (EPI data, see scripts/clean-history.js). Both lines start at 100 in 1948.
	// The shaded gap is value workers produced but weren't paid for. It sets up the profit-sharing chart.
	// data = [{ year, productivity, pay }] from loadProductivity() in #lib/data.js.
	let { data } = $props();

	const width = 760;
	const height = 380;
	const margin = { top: 34, right: 130, bottom: 36, left: 56 };
	const left = margin.left;
	const right = width - margin.right;
	const top = margin.top;
	const bottom = height - margin.bottom;

	const x = d3
		.scaleLinear()
		.domain(d3.extent(data, (d) => d.year))
		.range([left, right]);

	// Linear on purpose: the widening gap is the point, and a log scale would shrink it.
	const y = d3.scaleLinear().domain([0, 420]).range([bottom, top]);

	const line = (key) =>
		d3
			.line()
			.x((d) => x(d.year))
			.y((d) => y(d[key]))(data);
	const gap = d3
		.area()
		.x((d) => x(d.year))
		.y0((d) => y(d.pay))
		.y1((d) => y(d.productivity))(data);

	const byYear = new Map(data.map((d) => [d.year, d]));
	const last = data[data.length - 1];
	const SPLIT = 1973;

	const times = (v) => `${(v / 100).toFixed(1)}×`;
	// Hover shows each line as a percent of its 1948 level (1948 = 100%).
	const pct = (v) => `${Math.round(v)}%`;

	let xAxisG = $state();
	let yAxisG = $state();
	$effect(() => {
		d3.select(xAxisG).call(d3.axisBottom(x).ticks(8).tickFormat(d3.format('d')));
		d3.select(yAxisG).call(
			d3
				.axisLeft(y)
				.ticks(4)
				.tickFormat((v) => times(v))
		);
	});

	// Hover: the year nearest the mouse.
	let svg;
	let hovered = $state(null);
	function onmove(event) {
		const [mx] = d3.pointer(event, svg);
		const [first, lastYear] = x.domain();
		hovered = byYear.get(Math.max(first, Math.min(lastYear, Math.round(x.invert(mx))))) ?? null;
	}
</script>

<div class="chart">
	<svg
		viewBox="0 0 {width} {height}"
		bind:this={svg}
		role="img"
		aria-label="Productivity and pay since 1948"
		onmousemove={onmove}
		onmouseleave={() => (hovered = null)}
	>
		<text class="axis-title" x={left} y={14}>Growth since 1948 (1948 = 1×)</text>
		{#each y.ticks(4) as t (t)}
			<line class="grid" x1={left} x2={right} y1={y(t)} y2={y(t)} />
		{/each}

		<path class="gap" d={gap} />
		<path class="productivity-line" d={line('productivity')} />
		<path class="pay-line" d={line('pay')} />

		<!-- 1973: before it, pay grew with productivity; after it, they split. -->
		<line class="split" x1={x(SPLIT)} x2={x(SPLIT)} y1={top + 18} y2={bottom} />
		<text class="split-label" x={x(SPLIT) - 6} y={top + 12} text-anchor="end">Until 1973: they grow together</text>
		<text class="split-label" x={x(SPLIT) + 6} y={top + 12}>After 1973: they split</text>

		<!-- Labels at the right end of each line. -->
		<text class="end-label productivity-text" x={right + 8} y={y(last.productivity)} dominant-baseline="middle">
			Productivity {times(last.productivity)}
		</text>
		<text class="end-label pay-text" x={right + 8} y={y(last.pay)} dominant-baseline="middle">
			Pay {times(last.pay)}
		</text>
		<text class="end-label gap-text" x={right + 8} y={(y(last.productivity) + y(last.pay)) / 2} dominant-baseline="middle">
			← The gap
		</text>

		<!-- Hover line and rings go under the legend, so no dashed line crosses it. -->
		{#if hovered}
			{@const hx = x(hovered.year)}
			<line class="hover-line" x1={hx} x2={hx} y1={top} y2={bottom} />
			<circle class="hover-dot" cx={hx} cy={y(hovered.productivity)} r="5" />
			<circle class="hover-dot" cx={hx} cy={y(hovered.pay)} r="5" />
		{/if}

		<!-- Legend block in the empty top-left corner, drawn after the dashed lines so it sits on top. -->
		<g transform="translate({left + 12}, {top + 30})">
			<rect class="legend-box" width="330" height="86" rx="6" />
			<line class="productivity-line" x1="12" x2="36" y1="20" y2="20" />
			<text class="legend-text" x="44" y="20" dominant-baseline="middle">
				<tspan class="productivity-text">Productivity:</tspan> what a worker produces in an hour
			</text>
			<line class="pay-line" x1="12" x2="36" y1="43" y2="43" />
			<text class="legend-text" x="44" y="43" dominant-baseline="middle">
				<tspan class="pay-text">Pay:</tspan> what a worker is paid for that hour
			</text>
			<rect class="gap" x="12" y="59" width="24" height="14" />
			<text class="legend-text" x="44" y="66" dominant-baseline="middle">
				<tspan class="gap-text">The gap:</tspan> value that didn't reach their pay
			</text>
		</g>

		<!-- Hover labels go last, so they read on top of everything. -->
		{#if hovered}
			{@const hx = x(hovered.year)}
			{@const flip = hx > right - 230}
			<text class="hover-label" x={hx + (flip ? -8 : 8)} y={y(hovered.productivity) - 12} text-anchor={flip ? 'end' : 'start'}>
				{hovered.year}: productivity {pct(hovered.productivity)} of 1948
			</text>
			<text class="hover-label pay-text" x={hx + (flip ? -8 : 8)} y={y(hovered.pay) + 20} text-anchor={flip ? 'end' : 'start'}>
				pay {pct(hovered.pay)} of 1948
			</text>
		{/if}

		<g bind:this={xAxisG} transform="translate(0, {bottom})" />
		<g bind:this={yAxisG} transform="translate({left}, 0)" />
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
	/* Purple = what the company keeps (the same purple as the profit river), blue = workers' pay. */
	.gap {
		fill: var(--company);
		opacity: 0.35;
	}
	.productivity-line,
	.pay-line {
		fill: none;
		stroke-width: 3;
	}
	.productivity-line {
		stroke: var(--company-dark);
	}
	.pay-line {
		stroke: var(--worker);
	}
	.legend-box {
		fill: var(--card);
		stroke: #ddd3bf;
	}
	.legend-text {
		font-size: 13px;
		fill: #333;
	}
	.legend-text tspan {
		font-weight: 700;
	}
	.axis-title {
		font-size: 13px;
		font-weight: 600;
		fill: #333;
	}
	.split {
		stroke: #9a8f7c;
		stroke-dasharray: 3 3;
	}
	.split-label {
		font-size: 12px;
		font-weight: 600;
		fill: #555;
	}
	.end-label {
		font-size: 14px;
		font-weight: 700;
	}
	.productivity-text {
		fill: var(--company-dark);
	}
	.pay-text {
		fill: var(--worker);
	}
	.gap-text {
		fill: var(--company-dark);
		font-weight: 600;
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
		fill: var(--company-dark);
		paint-order: stroke;
		stroke: var(--bg);
		stroke-width: 4px;
		pointer-events: none;
	}
	.hover-label.pay-text {
		fill: var(--worker);
	}
</style>
