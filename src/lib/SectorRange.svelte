<script>
	import Placeholder from '#lib/Placeholder.svelte';

	// Range plot (Kayleen's draft): one row per sector, a dot at the lowest and highest pay ratio joined by a line.
	// data = every company (see parseRow in #lib/data.js for the fields).
	// order = sector names from highest to lowest median pay ratio (same order as the sector bars).
	// Replace the placeholder below with the chart.
	let { data, order } = $props();
</script>

<Placeholder
	label="Most vs. least equal company in each sector"
	plan={{
		shows:
			"For each sector, the company with the lowest and the highest pay ratio side by side (for example, Consumer Discretionary runs from 38:1 to 6,474:1), so competitors prove a smaller gap is possible.",
		interaction: "Pick a sector to compare its two extremes in detail."
	}}
/>
