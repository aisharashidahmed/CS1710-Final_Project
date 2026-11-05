<script>
	import * as d3 from 'd3';
	import Tooltip from '#lib/Tooltip.svelte';
	import CompanySearch from '#lib/CompanySearch.svelte';
	import TimeCompare from '#lib/TimeCompare.svelte';

	// One dot per company at its startYear (2021 − pay ratio, see scripts/clean.js): the year its median worker would
	// have had to start working to earn the CEO's one-year pay. Dots are stacked by century
	// (a unit chart), so the height of each pile shows how many companies land in that century.
	let { data } = $props();

	const width = 760;
	const margin = { top: 60, right: 20, bottom: 40, left: 20 };
	const START = -5000;
	const END = 2100;
	const BIN = 100; // years per pile

	// Linear on purpose: the point is how far back in real history the worst cases reach.
	const x = d3.scaleLinear().domain([START, END]).range([margin.left, width - margin.right]);

	// Each century is about 10px wide, so dots sit 3 to a row inside their century.
	const binWidth = x(START + BIN) - x(START);
	const cols = 3;
	const step = binWidth / cols;
	const r = step / 2 - 0.3;

	// Position every company inside its century's pile, oldest at the bottom.
	let placed = $derived.by(() => {
		const piles = d3.groups(
			d3.sort(data, (d) => d.startYear),
			(d) => Math.floor(d.startYear / BIN) * BIN
		);
		const out = [];
		for (const [binStart, companies] of piles) {
			companies.forEach((d, i) => {
				out.push({
					d,
					cx: x(binStart) + (i % cols) * step + step / 2,
					row: Math.floor(i / cols)
				});
			});
		}
		return out;
	});

	let maxRow = $derived(d3.max(placed, (p) => p.row) ?? 0);
	let height = $derived(margin.top + (maxRow + 1) * step + margin.bottom);
	let baseline = $derived(height - margin.bottom);
	const cy = (p) => baseline - p.row * step - step / 2;

	// History for scale. Dates are approximate.
	const landmarks = [
		{ year: -2560, label: 'Great Pyramid of Giza' },
		{ year: -753, label: 'Rome founded' },
		// There is no year 0: 1 BCE is followed directly by 1 CE.
		{ year: 1, label: '1 CE' },
		// Near the right edge, so this label ends at its line instead of centering on it.
		{ year: 1776, label: 'U.S. independence (1776)', anchor: 'end' }
	];

	const yearLabel = (y) => (y < 0 ? `${-y} BCE` : `${y}`);

	// Search: pick a company to pin its label on the timeline. Amazon is pinned by default.
	// $state.raw keeps the plain company object, so `p.d === pinned` below still matches.
	let pinned = $state.raw(data.find((d) => d.ticker === 'AMZN'));
	let pinnedPoint = $derived(placed.find((p) => p.d === pinned));

	let xAxisG = $state();
	$effect(() => {
		d3.select(xAxisG).call(
			d3
				.axisBottom(x)
				.tickValues([-5000, -4000, -3000, -2000, -1000, 1, 1000, 2000])
				.tickFormat(yearLabel)
		);
	});

	// The dots are only ~3px wide, so hover picks the nearest dot to the mouse.
	let delaunay = $derived(
		d3.Delaunay.from(
			placed,
			(p) => p.cx,
			(p) => cy(p)
		)
	);

	let wrapper;
	let svg;
	let tip = $state(null);
	// $state.raw for the same reason as `pinned`: clicking copies hovered.d into pinned.
	let hovered = $state.raw(null);

	function onmove(event) {
		const [mx, my] = d3.pointer(event, svg);
		const p = placed[delaunay.find(mx, my)];
		if (!p || Math.hypot(p.cx - mx, cy(p) - my) > 15) return onleave();
		hovered = p;
		const box = wrapper.getBoundingClientRect();
		const px = event.clientX - box.left;
		tip = {
			company: p.d,
			x: px,
			y: event.clientY - box.top,
			flip: px > box.width - 240,
			extra: `Worker would have started in ${yearLabel(p.d.startYear)}`
		};
	}

	function onleave() {
		hovered = null;
		tip = null;
	}
</script>

<CompanySearch {data} selected={pinned} onpick={(d) => (pinned = d)} />
<TimeCompare company={pinned} />

<div class="timeline chart" bind:this={wrapper}>
	<svg
		viewBox="0 0 {width} {height}"
		bind:this={svg}
		role="presentation"
		onmousemove={onmove}
		onmouseleave={onleave}
		onclick={() => hovered && (pinned = hovered.d)}
		class:pointing={hovered}
	>
		{#each landmarks as l (l.year)}
			<line class="landmark" x1={x(l.year)} x2={x(l.year)} y1={margin.top - 12} y2={baseline} />
			<text
				class="landmark-label"
				x={x(l.year) + (l.anchor === 'end' ? 4 : 0)}
				y={margin.top - 18}
				text-anchor={l.anchor ?? 'middle'}
			>
				{l.label}
			</text>
		{/each}

		{#each placed as p (p.d.ticker)}
			<circle
				cx={p.cx}
				cy={cy(p)}
				{r}
				fill={p.d === pinned ? 'var(--company-dark)' : 'var(--company)'}
			/>
		{/each}

		<!-- Pinned company: a line from its dot up to a label. -->
		{#if pinnedPoint}
			{@const px = pinnedPoint.cx}
			{@const anchor = px > width - 200 ? 'end' : 'start'}
			<line class="pin" x1={px} x2={px} y1={cy(pinnedPoint)} y2={margin.top - 44} />
			<text class="pin-label" x={px + (anchor === 'start' ? 4 : -4)} y={margin.top - 46} text-anchor={anchor}>
				{pinned.company}: {yearLabel(pinned.startYear)}
			</text>
		{/if}

		{#if hovered}
			<circle class="hovered" cx={hovered.cx} cy={cy(hovered)} r={r + 2} />
		{/if}

		<g bind:this={xAxisG} transform="translate(0, {baseline})" />
	</svg>
	<Tooltip {tip} />
</div>

<style>
	.timeline {
		position: relative;
	}
	svg.pointing {
		cursor: pointer;
	}
	svg {
		width: 100%;
		height: auto;
		display: block;
	}
	.landmark {
		stroke: #bbb;
		stroke-dasharray: 3 3;
	}
	.landmark-label {
		font-size: 11px;
		fill: #666;
	}
	.pin {
		stroke: var(--company-dark);
		stroke-width: 2;
	}
	.pin-label {
		font-size: 13px;
		font-weight: 700;
		fill: var(--company-dark);
	}
	.hovered {
		fill: none;
		stroke: #111;
		stroke-width: 1.5;
		pointer-events: none;
	}
</style>
