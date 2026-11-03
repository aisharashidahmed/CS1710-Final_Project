<script>
	import Placeholder from '#lib/Placeholder.svelte';

	// One card per company where belowPoverty is true, CEO pay next to worker pay.
	// data = every company (see parseRow in #lib/data.js for the fields).
	// Replace the placeholder below with the chart.
	let { data } = $props();
</script>

<Placeholder
	label="Below-the-poverty-line callout"
	height={200}
	plan={{
		shows:
			"The 34 companies whose median worker earned under $26,500 (2021 poverty line, family of four) as a grid of cards, with each CEO's pay next to the worker's. 19 of the 34 are in Consumer Discretionary.",
		interaction: "Filter the cards by sector."
	}}
/>
