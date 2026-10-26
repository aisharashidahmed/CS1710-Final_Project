<script>
	import * as d3 from 'd3';
	import Tooltip from '#lib/Tooltip.svelte';

	// One dot per company: x = pay ratio (log scale), one row per sector.
	let { data, order, hoveredSector = null } = $props();

	const width = 760;
	const rowHeight = 30;
	const margin = { top: 10, right: 20, bottom: 45, left: 170 };

	// Only rows for sectors that are in the (possibly filtered) data.
	let rows = $derived(order.filter((s) => data.some((d) => d.sector === s)));
	let height = $derived(margin.top + margin.bottom + rows.length * rowHeight);

	// Ratios run from 2:1 to 6,474:1, so a log scale keeps the low end readable.
	const x = d3.scaleLog().domain([1, 10000]).range([margin.left, width - margin.right]);

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
		d3.select(xAxisG).call(
			d3
				.axisBottom(x)
				.tickValues([1, 10, 100, 1000, 10000])
				.tickFormat((d) => `${d3.format(',')(d)}:1`)
		);
	});
	$effect(() => {
		d3.select(yAxisG).call(d3.axisLeft(y).tickSize(0).tickPadding(6));
	});

	let wrapper;
	let tip = $state(null);

	function showTip(event, company) {
		const box = wrapper.getBoundingClientRect();
		const px = event.clientX - box.left;
		tip = { company, x: px, y: event.clientY - box.top, flip: px > box.width - 240 };
	}
</script>

<div class="strip" bind:this={wrapper}>
	<svg viewBox="0 0 {width} {height}">
		<!-- Light row backgrounds so each sector reads as one group. -->
		{#each rows as sector, i (sector)}
			<rect
				x={margin.left}
				y={y(sector)}
				width={width - margin.left - margin.right}
				height={y.bandwidth()}
				fill={i % 2 ? '#fff' : '#f1f5f9'}
			/>
		{/each}

		{#each data as d (d.ticker)}
			<circle
				role="presentation"
				cx={x(d.ratio)}
				cy={cy(d)}
				r="3.5"
				fill={hoveredSector !== null && d.sector === hoveredSector ? 'var(--company-dark)' : 'var(--company)'}
				fill-opacity="0.8"
				opacity={hoveredSector === null || d.sector === hoveredSector ? 1 : 0.15}
				onmouseenter={(e) => showTip(e, d)}
				onmousemove={(e) => showTip(e, d)}
				onmouseleave={() => (tip = null)}
			/>
		{/each}

		<!-- Outline on the hovered dot, drawn last so it stays on top. -->
		{#if tip}
			<circle class="hovered" cx={x(tip.company.ratio)} cy={cy(tip.company)} r="5.5" />
		{/if}

		<g bind:this={xAxisG} transform="translate(0, {height - margin.bottom})" />
		<g bind:this={yAxisG} transform="translate({margin.left}, 0)" />

		<text class="axis-label" x={(margin.left + width - margin.right) / 2} y={height - 8}>
			CEO-to-worker pay ratio (log scale)
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
	.hovered {
		fill: none;
		stroke: #111;
		stroke-width: 2;
		pointer-events: none;
	}
	.axis-label {
		font-size: 13px;
		text-anchor: middle;
		fill: #333;
	}
</style>
