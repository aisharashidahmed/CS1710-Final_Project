<script>
	import * as d3 from 'd3';
	import Tooltip from '#lib/Tooltip.svelte';
	import { moneyShort } from '#lib/data.js';

	// x = median worker pay, y = CEO total pay (both log scales), one dot per company.
	let { data } = $props();

	const width = 760;
	const height = 480;
	const margin = { top: 15, right: 70, bottom: 50, left: 70 };

	// Worker pay runs $7K–$296K and CEO pay $143K–$296M, so both axes use log scales.
	const x = d3.scaleLog().domain([5000, 400000]).range([margin.left, width - margin.right]);
	const y = d3.scaleLog().domain([100000, 500000000]).range([height - margin.bottom, margin.top]);

	// Reference lines: every company on a line has the same pay ratio.
	const ratios = [10, 100, 1000];
	const [xMin, xMax] = x.domain();

	let xAxisG = $state();
	let yAxisG = $state();

	$effect(() => {
		d3.select(xAxisG).call(d3.axisBottom(x).ticks(5, moneyShort));
	});
	$effect(() => {
		d3.select(yAxisG).call(d3.axisLeft(y).ticks(6, moneyShort));
	});

	let wrapper;
	let tip = $state(null);

	function showTip(event, company) {
		const box = wrapper.getBoundingClientRect();
		const px = event.clientX - box.left;
		tip = { company, x: px, y: event.clientY - box.top, flip: px > box.width - 240 };
	}
</script>

<div class="scatter" bind:this={wrapper}>
	<svg viewBox="0 0 {width} {height}">
		<defs>
			<clipPath id="plot-area">
				<rect
					x={margin.left}
					y={margin.top}
					width={width - margin.left - margin.right}
					height={height - margin.top - margin.bottom}
				/>
			</clipPath>
		</defs>

		<g clip-path="url(#plot-area)">
			{#each ratios as r (r)}
				<line class="ref" x1={x(xMin)} y1={y(xMin * r)} x2={x(xMax)} y2={y(xMax * r)} />
			{/each}
		</g>
		{#each ratios as r (r)}
			<text class="ref-label" x={width - margin.right + 4} y={y(xMax * r)} dominant-baseline="middle">
				{r.toLocaleString()}:1
			</text>
		{/each}

		{#each data as d (d.ticker)}
			<circle
				role="presentation"
				cx={x(d.workerPay)}
				cy={y(d.ceoPay)}
				r="4"
				fill="#2563eb"
				fill-opacity="0.6"
				stroke="#1e3a8a"
				stroke-width="0.5"
				onmouseenter={(e) => showTip(e, d)}
				onmousemove={(e) => showTip(e, d)}
				onmouseleave={() => (tip = null)}
			/>
		{/each}

		<g bind:this={xAxisG} transform="translate(0, {height - margin.bottom})" />
		<g bind:this={yAxisG} transform="translate({margin.left}, 0)" />

		<text class="axis-label" x={(margin.left + width - margin.right) / 2} y={height - 10}>
			Median worker pay (log scale)
		</text>
		<text class="axis-label" transform="rotate(-90)" x={-(margin.top + height - margin.bottom) / 2} y={16}>
			CEO total pay (log scale)
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
	.ref {
		stroke: #94a3b8;
		stroke-dasharray: 4 4;
	}
	.ref-label {
		font-size: 11px;
		fill: #64748b;
	}
	.axis-label {
		font-size: 13px;
		text-anchor: middle;
		fill: #333;
	}
</style>
