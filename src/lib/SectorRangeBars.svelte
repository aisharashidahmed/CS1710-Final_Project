<script>
	import * as d3 from 'd3';
	import { money, ratioLabel } from '#lib/data.js';

	// One panel of paired horizontal bars for SectorRange's detail view: the same companies,
	// one dollar field (CEO total pay or median worker pay), one zero-based linear scale.
	// Linear (not log) on purpose: bar length must be proportional to dollars within the panel.
	// items = [{ company, kind: 'low' | 'high' }], already in the order to draw (same in both panels).
	let { items, field, title, cls } = $props();

	// The viewBox matches the panel's real width, so text stays at its true size on every screen.
	// (Not wrapped in .chart: that class forces 600px on phones, which hid most of the bars here.)
	// Below 520px the company names sit above their bars instead of beside them.
	let measured = $state(640);
	let width = $derived(Math.max(280, Math.min(760, measured || 640)));
	let stacked = $derived(width < 520);

	const barH = 18;
	let margin = $derived({ top: 6, right: stacked ? 100 : 118, bottom: 30, left: stacked ? 2 : 236 });

	// Short names wrap onto at most two lines so long names never run into the bars.
	const short = (n) => n.replace(/,? (Inc\.|Corporation|Company|Incorporated|plc|Plc|Group, Inc\.|& Co\.)$/, '');
	function wrap(text, max) {
		const lines = [''];
		for (const w of text.split(' ')) {
			const cur = lines[lines.length - 1];
			if (cur && (cur + ' ' + w).length > max) lines.push(w);
			else lines[lines.length - 1] = cur ? `${cur} ${w}` : w;
		}
		if (lines.length > 2) lines.splice(1, lines.length, lines.slice(1).join(' ').slice(0, max - 1) + '…');
		return lines;
	}
	const kindText = (d) => `${d.kind === 'low' ? 'lowest' : 'highest'} ratio, ${ratioLabel(d.company.ratio)}`;

	// Row geometry. Side-by-side: label left of the bar. Stacked: label lines, then the bar.
	let rows = $derived.by(() => {
		let top = margin.top;
		return items.map((d) => {
			const lines = wrap(short(d.company.company), stacked ? Math.floor((width - 4) / 8) : 30);
			const h = stacked ? lines.length * 17 + 16 + barH + 14 : 54;
			const barY = stacked ? top + lines.length * 17 + 20 : top + (54 - barH) / 2 - 2;
			const row = { d, lines, top, h, barY };
			top += h;
			return row;
		});
	});
	let height = $derived((rows.at(-1) ? rows.at(-1).top + rows.at(-1).h : margin.top) + margin.bottom);

	let x = $derived(
		d3
			.scaleLinear()
			.domain([0, d3.max(items, (d) => d.company[field]) || 1])
			.nice()
			.range([margin.left, width - margin.right])
	);

	// "$0", "$50M", "$20k" (moneyShort gives "$0.00" and "$50.0M" for round ticks).
	const tickLabel = (d) => (d === 0 ? '$0' : d3.format('$.2~s')(d).replace('G', 'B'));

	let axisG = $state();
	$effect(() => {
		d3.select(axisG)
			.call(d3.axisBottom(x).ticks(stacked ? 3 : 4).tickFormat(tickLabel))
			.call((g) => g.select('.domain').remove());
	});
</script>

<figure class="panel" bind:clientWidth={measured}>
	<figcaption><span class={cls}>{title}</span> <span class="scale">dollar scale for this panel only, starting at $0</span></figcaption>
	<svg
		viewBox="0 0 {width} {height}"
		width={width}
		height={height}
		role="img"
		aria-label="{title}: {items.map((d) => `${d.company.company} ${money(d.company[field])}`).join('; ')}"
	>
		{#each x.ticks(stacked ? 3 : 4) as t}
			<line class="grid" x1={x(t)} x2={x(t)} y1={margin.top} y2={height - margin.bottom} />
		{/each}
		{#each rows as { d, lines, top, barY } (d.company.ticker)}
			{@const lx = stacked ? 0 : margin.left - 12}
			{@const ly = stacked ? top + 14 : top + (lines.length === 1 ? 22 : 15)}
			<text class="name" class:stacked x={lx} y={ly}>
				{#each lines as l, j}<tspan x={lx} dy={j ? (stacked ? 17 : 15) : 0}>{l}</tspan>{/each}
			</text>
			<text class="kind" class:stacked x={lx} y={stacked ? ly + lines.length * 17 : top + (lines.length === 1 ? 38 : 45)}>
				{kindText(d)}
			</text>
			<rect
				class="bar {cls}"
				x={margin.left}
				y={barY}
				width={Math.max(0, x(d.company[field]) - margin.left)}
				height={barH}
			/>
			<text class="value" x={x(d.company[field]) + 6} y={barY + barH / 2} dominant-baseline="middle">
				{money(d.company[field])}
			</text>
		{/each}
		<g bind:this={axisG} transform="translate(0, {height - margin.bottom})" />
	</svg>
</figure>

<style>
	/* Capped so labels stay close to body-text size on wide screens. */
	.panel {
		margin: 0.75rem 0 0;
		max-width: 760px;
	}
	figcaption {
		font-weight: 600;
		font-size: 0.95rem;
	}
	.scale {
		font-weight: normal;
		font-size: 0.8rem;
		color: #666;
	}
	svg {
		display: block;
		max-width: 100%;
		height: auto;
		overflow: visible;
	}
	.grid {
		stroke: #ddd;
		stroke-dasharray: 3 3;
	}
	.name {
		font-size: 14px;
		text-anchor: end;
		fill: #222;
	}
	.kind {
		font-size: 12px;
		text-anchor: end;
		fill: #666;
	}
	.name.stacked,
	.kind.stacked {
		text-anchor: start;
	}
	.bar.ceo {
		fill: var(--ceo);
	}
	.bar.worker {
		fill: var(--worker);
	}
	.value {
		font-size: 13px;
		fill: #222;
		font-variant-numeric: tabular-nums;
	}
	svg :global(.tick text) {
		font-size: 12px;
	}
</style>
