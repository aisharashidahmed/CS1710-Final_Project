<script>
	import * as d3 from 'd3';
	import { ratioLabel } from '#lib/data.js';

	// hoveredSector and selectedSector are owned by the page; this view reports
	// hovers through onhover and clicks through onselect (onselect is optional).
	let {
		data,
		order,
		hoveredSector = null,
		selectedSector = null,
		onhover,
		onselect = null
	} = $props();

	const width = 760;
	const height = 360;
	const margin = { top: 10, right: 60, bottom: 45, left: 170 };

	// Median pay ratio and company count per sector, in the fixed page order.
	let sectors = $derived.by(() => {
		const stats = new Map(
			d3.rollups(
				data,
				(v) => ({ median: d3.median(v, (d) => d.ratio), count: v.length }),
				(d) => d.sector
			)
		);
		return order.map((sector) => ({ sector, ...(stats.get(sector) ?? { median: 0, count: 0 }) }));
	});

	let x = $derived(
		d3
			.scaleLinear()
			.domain([0, d3.max(sectors, (d) => d.median) || 1])
			.nice()
			.range([margin.left, width - margin.right])
	);

	let y = $derived(
		d3
			.scaleBand()
			.domain(order)
			.range([margin.top, height - margin.bottom])
			.padding(0.15)
	);

	let xAxisG = $state();
	let yAxisG = $state();

	// D3 draws the axes inside their own <g> elements.
	$effect(() => {
		d3.select(xAxisG).call(d3.axisBottom(x).ticks(5).tickFormat((d) => `${d}:1`));
	});
	$effect(() => {
		d3.select(yAxisG).call(d3.axisLeft(y).tickSize(0).tickPadding(6));
	});
</script>

<svg viewBox="0 0 {width} {height}">
	{#each sectors as s (s.sector)}
		<!-- The whole row is the hover/click target, so short bars are still easy to hit. -->
		<g
			class="bar"
			class:clickable={onselect}
			role="presentation"
			onmouseenter={() => onhover(s.sector)}
			onmouseleave={() => onhover(null)}
			onclick={() => onselect?.(s.sector)}
		>
			<rect
				x={x(0)}
				y={y(s.sector)}
				width={width - margin.right - x(0)}
				height={y.bandwidth()}
				fill="transparent"
			/>
			<rect
				x={x(0)}
				y={y(s.sector)}
				width={x(s.median) - x(0)}
				height={y.bandwidth()}
				fill={s.sector === hoveredSector ? '#1e3a8a' : '#2563eb'}
				opacity={selectedSector === null || s.sector === selectedSector ? 1 : 0.35}
				stroke={s.sector === selectedSector ? '#111' : 'none'}
				stroke-width="2"
			/>
			<text class="count" x={x(s.median) + 4} y={y(s.sector) + y.bandwidth() / 2} dominant-baseline="middle">
				{s.count ? ratioLabel(s.median) : '–'}
			</text>
		</g>
	{/each}

	<g bind:this={xAxisG} transform="translate(0, {height - margin.bottom})" />
	<g bind:this={yAxisG} transform="translate({margin.left}, 0)" />

	<text class="axis-label" x={(margin.left + width - margin.right) / 2} y={height - 8}>
		Median CEO-to-worker pay ratio
	</text>
</svg>

<style>
	svg {
		width: 100%;
		height: auto;
		display: block;
	}
	.bar.clickable {
		cursor: pointer;
	}
	.count {
		font-size: 11px;
		font-weight: bold;
		fill: #222;
	}
	.axis-label {
		font-size: 13px;
		text-anchor: middle;
		fill: #333;
	}
</style>
