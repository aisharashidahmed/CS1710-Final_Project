<script>
	import Placeholder from '#lib/Placeholder.svelte';
	// Basic needs as a share of pay, median worker vs. CEO (Q12). Plan: docs/Q12_PLAN.txt.
	// data = every company (see parseRow in #lib/data.js for the fields).
	// necessities = 5 income groups from loadNecessities() in #lib/data.js:
	//   { quintile, lowerLimit, incomeMean, food, housing, transportation, healthcare, necessities }
	// Replace the placeholder below with the chart.
	let { data, necessities } = $props();
</script>

<Placeholder
	label="How much of their pay goes to basic needs?"
	height={260}
	plan={{
		shows:
			"For a picked company, two bars per person on the same dollar scale: their pay, and what a U.S. household with about the same income spends on housing, food, transportation and health care. At Dollar Tree, basic needs cost 186% of the median worker's pay; for the CEO, about 0.8%.",
		interaction: 'Search for a company; hover a piece to see its dollars.'
	}}
/>
