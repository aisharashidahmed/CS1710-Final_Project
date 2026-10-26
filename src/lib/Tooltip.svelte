<script>
	import { money, ratioLabel } from '#lib/data.js';

	// tip = { company, x, y, flip } in pixels relative to the chart wrapper.
	let { tip } = $props();
</script>

{#if tip}
	<div class="tooltip" class:flip={tip.flip} style:left="{tip.x}px" style:top="{tip.y}px">
		<strong>{tip.company.company}</strong>
		<div>{tip.company.sector}</div>
		<div>CEO ({tip.company.ceo}): {money(tip.company.ceoPay)}</div>
		<div>Median worker: {money(tip.company.workerPay)}</div>
		<div>Pay ratio: <strong>{ratioLabel(tip.company.ratio)}</strong></div>
	</div>
{/if}

<style>
	.tooltip {
		position: absolute;
		transform: translate(12px, 12px);
		width: max-content;
		max-width: 240px;
		padding: 6px 8px;
		background: #fff;
		border: 1px solid #ccc;
		border-radius: 4px;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
		font-size: 13px;
		line-height: 1.35;
		pointer-events: none;
		z-index: 1;
	}
	.tooltip.flip {
		transform: translate(calc(-100% - 12px), 12px);
	}
</style>
