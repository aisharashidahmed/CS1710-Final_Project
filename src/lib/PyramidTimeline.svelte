<script>
	import * as d3 from 'd3';
	import Tooltip from '#lib/Tooltip.svelte';

	// One dot per company at its startYear (2021 − pay ratio, see scripts/clean.js): the year its
	// median worker would have had to start working to earn the CEO's one-year pay. Dots are stacked
	// in piles (a unit chart), so the height of each pile shows how many companies land there.
	//
	// view = { start, end }: the years shown. Changing it zooms the timeline; dots slide to their new piles.
	// pinned = company to label with a line (or null). marker = { year, label } dashed line (or null).
	// onpick(company) is called when a dot is clicked (null = dots are not clickable).
	let { data, view, pinned = null, marker = null, onpick = null } = $props();

	const width = 760;
	const plotHeight = 230;
	const margin = { top: 96, right: 24, bottom: 40, left: 24 };
	const height = margin.top + plotHeight + margin.bottom;
	const baseline = margin.top + plotHeight;

	// Linear on purpose: the point is how far back in real history the worst cases reach.
	let x = $derived(
		d3.scaleLinear().domain([view.start, view.end]).range([margin.left, width - margin.right])
	);

	// About 70 piles across the view, in a readable number of years (1, 10, 100, ...).
	const SIZES = [1, 2, 5, 10, 20, 25, 50, 100, 200, 500, 1000];
	let bin = $derived(SIZES.find((s) => (view.end - view.start) / s <= 80));

	let visible = $derived(data.filter((d) => d.startYear >= view.start));
	let hiddenCount = $derived(data.length - visible.length);

	// Fit the tallest pile in the plot: use the fewest dots per row that still fit.
	let layout = $derived.by(() => {
		const binWidth = x(view.start + bin) - x(view.start);
		const tallest = d3.max(
			d3.rollups(visible, (v) => v.length, (d) => Math.floor(d.startYear / bin)),
			(d) => d[1]
		);
		let cols = 1;
		while (Math.ceil(tallest / cols) * (binWidth / cols) > plotHeight) cols++;
		const step = binWidth / cols;
		return { cols, step, r: Math.max(1, step / 2 - 0.4) };
	});

	// Position every company. Companies before the view wait, invisible, at the left edge.
	let placed = $derived.by(() => {
		const { cols, step } = layout;
		const out = [];
		const piles = d3.groups(
			d3.sort(visible, (d) => d.startYear),
			(d) => Math.floor(d.startYear / bin) * bin
		);
		for (const [binStart, companies] of piles) {
			companies.forEach((d, i) => {
				out.push({
					d,
					cx: x(binStart) + (i % cols) * step + step / 2,
					cy: baseline - Math.floor(i / cols) * step - step / 2,
					shown: true
				});
			});
		}
		for (const d of data) {
			if (d.startYear < view.start) out.push({ d, cx: margin.left, cy: baseline - 4, shown: false });
		}
		return out;
	});

	let pinnedPoint = $derived(placed.find((p) => p.d === pinned && p.shown));

	// History for scale. Dates are approximate. maxSpan hides a label when the view is too wide for it.
	const landmarks = [
		{ year: -2560, label: 'Great Pyramid of Giza' },
		{ year: -753, label: 'Rome founded' },
		// There is no year 0: 1 BCE is followed directly by 1 CE.
		{ year: 1, label: '1 CE' },
		{ year: 1776, label: 'U.S. independence (1776)' },
		{ year: 1969, label: 'Moon landing (1969)', maxSpan: 600 }
	];
	let shownLandmarks = $derived(
		landmarks.filter(
			(l) =>
				l.year >= view.start &&
				l.year <= view.end &&
				(l.maxSpan ?? Infinity) >= view.end - view.start
		)
	);
	// Labels near an edge end (or start) at their line instead of centering on it.
	const anchorFor = (px) => (px > width - 150 ? 'end' : px < 150 ? 'start' : 'middle');

	const yearLabel = (y) => (y < 0 ? `${-y} BCE` : `${y}`);

	let xAxisG = $state();
	$effect(() => {
		d3.select(xAxisG)
			.transition()
			.duration(700)
			.call(d3.axisBottom(x).ticks(8).tickFormat(yearLabel));
	});

	// The dots can be ~3px wide, so hover picks the nearest shown dot to the mouse.
	let shownPoints = $derived(placed.filter((p) => p.shown));
	let delaunay = $derived(
		d3.Delaunay.from(
			shownPoints,
			(p) => p.cx,
			(p) => p.cy
		)
	);

	let wrapper;
	let svg;
	let tip = $state(null);
	// $state.raw keeps the plain company objects, so `p.d === pinned` still matches after a click.
	let hovered = $state.raw(null);

	function onmove(event) {
		const [mx, my] = d3.pointer(event, svg);
		const p = shownPoints[delaunay.find(mx, my)];
		if (!p || Math.hypot(p.cx - mx, p.cy - my) > 15) return onleave();
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

<div class="timeline chart" bind:this={wrapper}>
	<svg
		viewBox="0 0 {width} {height}"
		bind:this={svg}
		role="presentation"
		onmousemove={onmove}
		onmouseleave={onleave}
		onclick={() => hovered && onpick?.(hovered.d)}
		class:pointing={hovered && onpick}
	>
		{#each shownLandmarks as l (l.year)}
			{@const px = x(l.year)}
			<line class="landmark" x1={px} x2={px} y1={margin.top - 22} y2={baseline} />
			<text class="landmark-label" x={px} y={margin.top - 28} text-anchor={anchorFor(px)}>
				{l.label}
			</text>
		{/each}

		{#if marker && marker.year >= view.start}
			{@const px = x(marker.year)}
			<line class="marker" x1={px} x2={px} y1={margin.top - 46} y2={baseline} />
			<text class="marker-label" x={px} y={margin.top - 52} text-anchor={anchorFor(px)}>
				{marker.label}
			</text>
		{/if}

		<!-- Dots move with a CSS transform transition, so zooming slides them to their new piles. -->
		{#each placed as p (p.d.ticker)}
			<circle
				class="dot"
				style:transform="translate({p.cx}px, {p.cy}px)"
				r={layout.r}
				opacity={p.shown ? 1 : 0}
				fill={p.d === pinned ? 'var(--company-dark)' : 'var(--company)'}
			/>
		{/each}

		{#if hiddenCount}
			<text class="edge-note" x={margin.left} y={baseline + 34}>
				← {hiddenCount} more companies start even earlier
			</text>
		{/if}

		<!-- Pinned company: a line from its dot up to a label. -->
		{#if pinnedPoint}
			{@const px = pinnedPoint.cx}
			<line class="pin" x1={px} x2={px} y1={pinnedPoint.cy} y2={margin.top - 74} />
			<text class="pin-label" x={px} y={margin.top - 78} text-anchor={anchorFor(px)}>
				{pinned.company}: {yearLabel(pinned.startYear)}
			</text>
		{/if}

		{#if hovered}
			<circle class="hovered" cx={hovered.cx} cy={hovered.cy} r={layout.r + 2} />
		{/if}

		<g bind:this={xAxisG} transform="translate(0, {baseline})" />
	</svg>
	<Tooltip {tip} />
</div>

<style>
	.timeline {
		position: relative;
	}
	svg {
		width: 100%;
		height: auto;
		display: block;
	}
	svg.pointing {
		cursor: pointer;
	}
	.dot {
		transition:
			transform 700ms cubic-bezier(0.33, 1, 0.68, 1),
			r 700ms,
			opacity 400ms,
			fill 200ms;
	}
	@media (prefers-reduced-motion: reduce) {
		.dot {
			transition: none;
		}
	}
	.landmark {
		stroke: #bbb;
		stroke-dasharray: 3 3;
	}
	.landmark-label {
		font-size: 12px;
		fill: #666;
	}
	.marker {
		stroke: var(--sector-dark);
		stroke-width: 1.5;
		stroke-dasharray: 6 4;
	}
	.marker-label {
		font-size: 13px;
		font-weight: 700;
		fill: var(--sector-dark);
	}
	.edge-note {
		font-size: 12px;
		fill: #666;
	}
	.pin {
		stroke: var(--company-dark);
		stroke-width: 2;
	}
	.pin-label {
		font-size: 14px;
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
