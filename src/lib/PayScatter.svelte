<script>
	import * as d3 from 'd3';
	import Tooltip from '#lib/Tooltip.svelte';
	import { moneyShort } from '#lib/data.js';
	import { DURATION } from '#lib/motion.js';

	// x = median worker pay, y = CEO total pay, one dot per company.
	// The page owns the selected company; clicks are reported through onselect.
	let { data, selectedTicker = null, onselect } = $props();

	const width = 760;
	const height = 420;
	const margin = { top: 30, right: 80, bottom: 50, left: 70 };
	const left = margin.left;
	const right = width - margin.right;
	const top = margin.top;
	const bottom = height - margin.bottom;

	// Worker pay runs $7K–$296K and CEO pay $143K–$296M, so both axes start on log scales.
	// The reader can switch to regular (linear) scales to see how extreme the top is.
	let linear = $state(false);
	let x = $derived(
		linear
			? d3.scaleLinear().domain([0, 300000]).range([left, right])
			: d3.scaleLog().domain([5000, 400000]).range([left, right])
	);
	let y = $derived(
		linear
			? d3.scaleLinear().domain([0, 300000000]).range([bottom, top])
			: d3.scaleLog().domain([100000, 500000000]).range([bottom, top])
	);

	// On log scales, gridlines sit at powers of 10, so each one is 10× the last.
	let xTicks = $derived(linear ? x.ticks(6) : [10000, 100000]);
	let yTicks = $derived(linear ? y.ticks(6) : [1e5, 1e6, 1e7, 1e8]);

	// Reference lines: every company on a line has the same pay ratio (CEO pay = ratio × worker pay).
	// Each line ends where it leaves the plot, at the right edge or the top.
	const ratios = [10, 100, 1000];
	let refLines = $derived(
		ratios.map((r) => {
			const [x0, x1] = x.domain();
			const [, y1] = y.domain();
			const xEnd = Math.min(x1, y1 / r);
			return { r, x0, y0: x0 * r, xEnd, yEnd: xEnd * r };
		})
	);

	// Well-known companies labeled on the chart, so the reader has landmarks.
	const LABELS = {
		AMZN: 'Amazon',
		MCD: "McDonald's",
		'BRK.B': 'Berkshire Hathaway'
	};
	let labeled = $derived(data.filter((d) => LABELS[d.ticker]));

	const tickLabel = (v) => (v === 0 ? '$0' : moneyShort(v));

	let xAxisG = $state();
	let yAxisG = $state();

	$effect(() => {
		d3.select(xAxisG)
			.transition()
			.duration(DURATION)
			.call(d3.axisBottom(x).tickValues(xTicks).tickFormat(tickLabel));
	});
	$effect(() => {
		d3.select(yAxisG)
			.transition()
			.duration(DURATION)
			.call(d3.axisLeft(y).tickValues(yTicks).tickFormat(tickLabel));
	});

	let wrapper;
	let tip = $state(null);

	function showTip(event, company) {
		const box = wrapper.getBoundingClientRect();
		const px = event.clientX - box.left;
		tip = { company, x: px, y: event.clientY - box.top, flip: px > box.width - 240 };
	}

	let selected = $derived(data.find((d) => d.ticker === selectedTicker));
</script>

<div class="scale-toggle" role="group" aria-label="Axis scale">
	<button type="button" class:on={!linear} onclick={() => (linear = false)}>Log scale</button>
	<button type="button" class:on={linear} onclick={() => (linear = true)}>Regular scale</button>
</div>

<div class="scatter chart" bind:this={wrapper} style:--duration="{DURATION}ms">
	<svg viewBox="0 0 {width} {height}">
		<defs>
			<clipPath id="plot-area">
				<rect x={left} y={top} width={right - left} height={bottom - top} />
			</clipPath>
		</defs>

		<!-- Light gridlines at each tick. -->
		{#each xTicks as t (t)}
			<line class="grid" x1={x(t)} x2={x(t)} y1={top} y2={bottom} />
		{/each}
		{#each yTicks as t (t)}
			<line class="grid" x1={left} x2={right} y1={y(t)} y2={y(t)} />
		{/each}

		<g clip-path="url(#plot-area)">
			{#each refLines as l (l.r)}
				<line class="ref" x1={x(l.x0)} y1={y(l.y0)} x2={x(l.xEnd)} y2={y(l.yEnd)} />
			{/each}
		</g>
		{#each refLines as l (l.r)}
			<text
				class="ref-label"
				x={x(l.xEnd) + 4}
				y={y(l.yEnd) + (l.xEnd < x.domain()[1] ? 12 : 0)}
				dominant-baseline="middle"
			>
				{l.r.toLocaleString()}:1
			</text>
		{/each}

		<!-- Corner hints: what moving up or right means. -->
		<text class="hint ceo-hint" x={left + 8} y={top + 14}>↑ CEO paid more</text>
		<text class="hint worker-hint" x={right - 8} y={bottom - 10} text-anchor="end">
			Worker paid more →
		</text>

		{#each data as d (d.ticker)}
			<circle
				role="presentation"
				class="dot"
				style:transform="translate({x(d.workerPay)}px, {y(d.ceoPay)}px)"
				r="4"
				fill="var(--company)"
				fill-opacity="0.6"
				stroke="#fff"
				stroke-width="0.75"
				onmouseenter={(e) => showTip(e, d)}
				onmousemove={(e) => showTip(e, d)}
				onmouseleave={() => (tip = null)}
				onclick={() => onselect(d.ticker)}
			/>
		{/each}

		{#each labeled as d (d.ticker)}
			<!-- Every label sits up and to the right of its dot. -->
			<text
				class="dot-label"
				style:transform="translate({x(d.workerPay) + 8}px, {y(d.ceoPay) - 6}px)"
			>
				{LABELS[d.ticker]}
			</text>
		{/each}

		{#if tip}
			<circle class="hovered" cx={x(tip.company.workerPay)} cy={y(tip.company.ceoPay)} r="6" />
		{/if}

		<!-- Ring around the clicked company, drawn last so it stays on top. -->
		{#if selected}
			<circle class="selected" cx={x(selected.workerPay)} cy={y(selected.ceoPay)} r="8" />
		{/if}

		<g bind:this={xAxisG} transform="translate(0, {bottom})" />
		<g bind:this={yAxisG} transform="translate({left}, 0)" />

		<text class="axis-label worker-label" x={(left + right) / 2} y={height - 10}>
			Median worker pay ({linear ? 'regular scale' : 'log scale: each gridline is 10× the last'})
		</text>
		<text class="axis-label ceo-label" transform="rotate(-90)" x={-(top + bottom) / 2} y={16}>
			CEO total pay ({linear ? 'regular scale' : 'log scale'})
		</text>
	</svg>
	<Tooltip {tip} />
</div>

<style>
	.scatter {
		position: relative;
	}
	svg {
		width: 100%;
		height: auto;
		display: block;
	}
	circle {
		cursor: pointer;
	}
	.dot,
	.dot-label {
		transition: transform var(--duration) cubic-bezier(0.33, 1, 0.68, 1);
	}
	.hovered {
		fill: none;
		stroke: #111;
		stroke-width: 2;
		pointer-events: none;
	}
	.selected {
		fill: none;
		stroke: var(--ceo);
		stroke-width: 2.5;
		pointer-events: none;
	}
	.grid {
		stroke: #eee;
	}
	.ref {
		stroke: #94a3b8;
		stroke-dasharray: 4 4;
	}
	.ref-label {
		font-size: 11px;
		fill: #64748b;
	}
	.hint {
		font-size: 13px;
		font-weight: 600;
	}
	.ceo-hint {
		fill: var(--ceo);
	}
	.worker-hint {
		fill: var(--worker);
	}
	.dot-label {
		font-size: 12px;
		font-weight: 700;
		fill: var(--company-dark);
		pointer-events: none;
	}
	.axis-label {
		font-size: 13px;
		font-weight: 600;
		text-anchor: middle;
		fill: #333;
	}
	.ceo-label {
		fill: var(--ceo);
	}
	.worker-label {
		fill: var(--worker);
	}
	.scale-toggle {
		display: inline-flex;
		margin: 0.25rem 0 0.5rem;
		border: 1px solid #bbb;
		border-radius: 999px;
		overflow: hidden;
	}
	.scale-toggle button {
		border: none;
		border-radius: 0;
	}
	.scale-toggle button.on {
		background: var(--sector-dark);
		color: #fff;
	}
</style>
