<script>
	import * as d3 from 'd3';
	import Tooltip from '#lib/Tooltip.svelte';
	import { money } from '#lib/data.js';

	let { data } = $props();

	const width = 760;
	const height = 540;
	const margin = { top: 82, right: 170, bottom: 42, left: 170 };
	const leftX = margin.left;
	const rightX = width - margin.right;
	const top = margin.top;
	const bottom = height - margin.bottom;

	const EXAMPLES = [
		{ match: "McDonald's Corporation", label: "McDonald's" },
		{ match: 'Aptiv Plc', label: 'Aptiv' },
		{ match: 'Carnival Corporation', label: 'Carnival' },
		{ match: 'Etsy, Inc.', label: 'Etsy' }
	];

	let hovered = $state.raw(null);
	let wrapper;
	let tip = $state(null);

	let y = $derived(d3.scaleLinear().domain([1, data.length]).range([top, bottom]));
	let yTicks = $derived([1, 100, 200, 300, 400, 492].filter((r) => r <= data.length));

	let highlighted = $derived(
		EXAMPLES.map((example) => data.find((d) => d.company === example.match)).filter(Boolean)
	);

	function labelYs() {
		const positioned = highlighted
			.map((d) => ({ company: d, y: y(d.ratioRank) }))
			.sort((a, b) => a.y - b.y);
		let previous = top - 12;
		return positioned.map((item) => {
			const adjusted = Math.max(item.y, previous + 22);
			previous = adjusted;
			return { ...item, y: Math.min(adjusted, bottom - 2) };
		});
	}
	let positionedLabels = $derived(labelYs());

	function showTip(event, company) {
		hovered = company;
		const box = wrapper.getBoundingClientRect();
		const fromPointer = event.type !== 'focus';
		const px = fromPointer && Number.isFinite(event.clientX)
			? event.clientX - box.left
			: Math.min(box.width * 0.75, box.width - 240);
		const py = fromPointer && Number.isFinite(event.clientY)
			? event.clientY - box.top
			: y(company.ratioRank) / height * box.height;
		tip = {
			company,
			x: px,
			y: py,
			flip: px > box.width - 240,
			extra: `CEO pay rank: ${company.ceoPayRank} · Pay ratio rank: ${company.ratioRank}`
		};
	}

	function clearTip() {
		hovered = null;
		tip = null;
	}

	function isHighlighted(company) {
		return highlighted.some((d) => d.ticker === company.ticker);
	}

	function exampleLabel(company) {
		return EXAMPLES.find((item) => item.match === company.company)?.label;
	}

	function lineOpacity(company) {
		if (!hovered) return isHighlighted(company) ? 0.72 : 0.1;
		if (hovered.ticker === company.ticker) return 1;
		return 0.07;
	}
</script>

<div class="slope-chart">
	<p class="chart-lead">
		The companies with the <span class="ceo">highest-paid CEOs</span> are not always the companies
		with the largest pay gaps.
	</p>
	<p class="chart-note">
		Rank 1 is highest on both sides. A steep line means a company's relative position changes
		substantially between CEO pay and pay ratio.
	</p>

	<div class="chart" bind:this={wrapper}>
		<svg viewBox="0 0 {width} {height}" role="img" aria-label="Slope chart comparing CEO pay rank with pay ratio rank">
			<text class="column-header ceo-header" x={leftX} y="34" text-anchor="middle">
				CEO pay rank
			</text>
			<text class="column-header worker-header" x={rightX} y="34" text-anchor="middle">
				Pay ratio rank
			</text>
			<text class="rank-direction" x={leftX} y="58" text-anchor="middle">Rank 1 is highest</text>
			<text class="rank-direction" x={rightX} y="58" text-anchor="middle">Rank 1 is highest</text>

			<line class="axis" x1={leftX} x2={leftX} y1={top} y2={bottom} />
			<line class="axis" x1={rightX} x2={rightX} y1={top} y2={bottom} />

			{#each yTicks as rank (rank)}
				<line class="grid" x1={leftX - 12} x2={rightX + 12} y1={y(rank)} y2={y(rank)} />
				<text class="tick" x={leftX - 24} y={y(rank)} text-anchor="end" dominant-baseline="middle">{rank}</text>
				<text class="tick" x={rightX + 24} y={y(rank)} dominant-baseline="middle">{rank}</text>
			{/each}

			{#each data as company (company.ticker)}
				<path
					class="company-line"
					class:highlighted={isHighlighted(company)}
					d={`M ${leftX} ${y(company.ceoPayRank)} L ${rightX} ${y(company.ratioRank)}`}
					stroke-width={isHighlighted(company) ? 2.4 : 1}
					stroke-opacity={lineOpacity(company)}
				/>
				<path
					class="line-hit"
					d={`M ${leftX} ${y(company.ceoPayRank)} L ${rightX} ${y(company.ratioRank)}`}
					role="button"
					tabindex="0"
					aria-label={`${company.company}: CEO pay rank ${company.ceoPayRank}, pay ratio rank ${company.ratioRank}, CEO pay ${money(company.ceoPay)}`}
					onfocus={(event) => showTip(event, company)}
					onblur={clearTip}
					onmouseenter={(event) => showTip(event, company)}
					onmousemove={(event) => showTip(event, company)}
					onmouseleave={clearTip}
				/>
			{/each}

			{#each positionedLabels as item (item.company.ticker)}
				<circle cx={rightX} cy={y(item.company.ratioRank)} r="4" class="example-dot" />
				<line
					class="label-leader"
					x1={rightX + 5}
					y1={y(item.company.ratioRank)}
					x2={rightX + 10}
					y2={item.y}
				/>
				<text class="example-label" x={rightX + 14} y={item.y} dominant-baseline="middle">
					{exampleLabel(item.company)}
				</text>
				<text class="example-ranks" x={rightX + 14} y={item.y + 14}>
					{item.company.ceoPayRank} → {item.company.ratioRank}
				</text>
			{/each}
		</svg>
		<Tooltip {tip} />
	</div>
</div>

<style>
	.slope-chart {
		margin-top: 1rem;
	}
	.chart-lead {
		font-weight: 700;
		margin-bottom: 0.25rem;
	}
	.chart-note {
		margin-top: 0;
		color: #555;
		font-size: 0.95rem;
	}
	.chart {
		position: relative;
	}
	svg {
		width: 100%;
		height: auto;
		display: block;
	}
	.column-header {
		font-size: 16px;
		font-weight: 800;
	}
	.ceo-header {
		fill: var(--ceo);
	}
	.worker-header {
		fill: var(--company-dark);
	}
	.rank-direction {
		fill: #777;
		font-size: 12px;
	}
	.axis {
		stroke: var(--sector-dark);
		stroke-width: 1;
	}
	.grid {
		stroke: #ddd3bf;
		stroke-width: 1;
	}
	.tick {
		fill: #666;
		font-size: 12px;
	}
	.company-line {
		fill: none;
		stroke: var(--company);
		transition: stroke-opacity 150ms ease, stroke-width 150ms ease;
		pointer-events: none;
	}
	.company-line.highlighted {
		stroke: var(--company-dark);
	}
	.line-hit {
		fill: none;
		stroke: transparent;
		stroke-width: 10;
		cursor: crosshair;
	}
	.example-dot {
		fill: var(--company-dark);
		stroke: var(--bg);
		stroke-width: 1;
	}
	.label-leader {
		stroke: var(--company-dark);
		stroke-width: 1;
	}
	.example-label {
		fill: var(--sector-dark);
		font-size: 13px;
		font-weight: 800;
	}
	.example-ranks {
		fill: #666;
		font-size: 11px;
	}
	@media (max-width: 640px) {
		.chart-lead,
		.chart-note {
			padding-right: 0.25rem;
		}
	}
</style>
