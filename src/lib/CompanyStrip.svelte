<script>
	import * as d3 from 'd3';
	import { Tween } from 'svelte/motion';
	import { fade } from 'svelte/transition';
	import Tooltip from '#lib/Tooltip.svelte';
	import { DURATION, easing } from '#lib/motion.js';

	// One dot per company: x = pay ratio (log scale), one row per sector.
	let { data, order, hoveredSector = null } = $props();

	const width = 760;
	const rowHeight = 30;
	const margin = { top: 10, right: 20, bottom: 45, left: 170 };

	// Only rows for sectors that are in the (possibly filtered) data.
	let rows = $derived(order.filter((s) => data.some((d) => d.sector === s)));
	let height = $derived(margin.top + margin.bottom + rows.length * rowHeight);

	// When filtering, the chart grows or shrinks smoothly instead of jumping.
	const shownHeight = Tween.of(() => height, { duration: DURATION, easing });

	// Ratios run from 2:1 to 6,474:1, so a log scale keeps the low end readable.
	// The reader can switch to a regular (linear) scale to see how extreme the outliers are.
	let linear = $state(false);
	let x = $derived(
		linear
			? d3.scaleLinear().domain([0, 7000]).range([margin.left, width - margin.right])
			: d3.scaleLog().domain([1, 10000]).range([margin.left, width - margin.right])
	);

	let y = $derived(
		d3
			.scaleBand()
			.domain(rows)
			.range([margin.top, height - margin.bottom])
			.padding(0.1)
	);

	// Fixed vertical jitter per company so overlapping dots spread out within the row.
	function jitter(ticker) {
		let h = 0;
		for (const c of ticker) h = (h * 31 + c.charCodeAt(0)) % 1000;
		return h / 1000 - 0.5;
	}

	function cy(d) {
		return y(d.sector) + y.bandwidth() / 2 + jitter(d.ticker) * y.bandwidth() * 0.8;
	}

	let xAxisG = $state();
	let yAxisG = $state();

	$effect(() => {
		d3.select(xAxisG)
			.transition()
			.duration(DURATION)
			.call(
				d3
					.axisBottom(x)
					.tickValues(linear ? [0, 1000, 2000, 3000, 4000, 5000, 6000, 7000] : [1, 10, 100, 1000, 10000])
					.tickFormat((d) => `${d3.format(',')(d)}:1`)
			);
	});
	$effect(() => {
		d3.select(yAxisG)
			.transition()
			.duration(DURATION)
			.ease(d3.easeCubicOut)
			.call(d3.axisLeft(y).tickSize(0).tickPadding(6));
	});

	let wrapper;
	let tip = $state(null);

	function showTip(event, company) {
		const box = wrapper.getBoundingClientRect();
		const px = event.clientX - box.left;
		tip = { company, x: px, y: event.clientY - box.top, flip: px > box.width - 240 };
	}
</script>

<div class="scale-toggle" role="group" aria-label="Axis scale">
	<button type="button" class:on={!linear} onclick={() => (linear = false)}>Log scale</button>
	<button type="button" class:on={linear} onclick={() => (linear = true)}>Regular scale</button>
</div>

<div class="strip chart" bind:this={wrapper} style:--duration="{DURATION}ms">
	<svg viewBox="0 0 {width} {shownHeight.current}">
		<!-- Light row backgrounds so each sector reads as one group. -->
		{#each rows as sector, i (sector)}
			<rect
				class="row"
				x={margin.left}
				style:transform="translateY({y(sector)}px)"
				width={width - margin.left - margin.right}
				height={y.bandwidth()}
				fill={i % 2 ? '#fff' : '#f1f5f9'}
				transition:fade={{ duration: DURATION }}
			/>
		{/each}

		{#each data as d (d.ticker)}
			<!-- Dots are placed with a CSS transform so they slide to their new row when filtering. -->
			<circle
				role="presentation"
				class="dot"
				style:transform="translate({x(d.ratio)}px, {cy(d)}px)"
				r="3.5"
				fill={hoveredSector !== null && d.sector === hoveredSector ? 'var(--company-dark)' : 'var(--company)'}
				fill-opacity="0.55"
				stroke="#fff"
				stroke-width="0.75"
				opacity={hoveredSector === null || d.sector === hoveredSector ? 1 : 0.15}
				onmouseenter={(e) => showTip(e, d)}
				onmousemove={(e) => showTip(e, d)}
				onmouseleave={() => (tip = null)}
				transition:fade={{ duration: DURATION }}
			/>
		{/each}

		<!-- Outline on the hovered dot, drawn last so it stays on top. -->
		{#if tip}
			<circle class="hovered" cx={x(tip.company.ratio)} cy={cy(tip.company)} r="5.5" />
		{/if}

		<g bind:this={xAxisG} transform="translate(0, {shownHeight.current - margin.bottom})" />
		<g bind:this={yAxisG} transform="translate({margin.left}, 0)" />

		<text class="axis-label" x={(margin.left + width - margin.right) / 2} y={shownHeight.current - 8}>
			CEO-to-worker pay ratio ({linear ? 'regular scale' : 'log scale: each step is 10× the last'})
		</text>
	</svg>
	<Tooltip {tip} />
</div>

<style>
	.strip {
		position: relative;
	}
	svg {
		width: 100%;
		height: auto;
		display: block;
	}
	circle {
		cursor: default;
	}
	.dot,
	.row {
		transition:
			transform var(--duration) cubic-bezier(0.33, 1, 0.68, 1),
			opacity 200ms,
			fill 200ms;
	}
	.hovered {
		fill: none;
		stroke: #111;
		stroke-width: 2;
		pointer-events: none;
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
	.axis-label {
		font-size: 13px;
		text-anchor: middle;
		fill: #333;
	}
</style>
