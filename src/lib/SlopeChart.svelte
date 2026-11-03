<script>
	import Placeholder from '#lib/Placeholder.svelte';

	// One line per company from its CEO pay rank (left) to its pay ratio rank (right). Fields: ceoPayRank, ratioRank.
	// data = every company (see parseRow in #lib/data.js for the fields).
	// Replace the placeholder below with the chart.
	let { data } = $props();
</script>

<Placeholder
	label="Slope chart: CEO pay rank vs. pay ratio rank"
	plan={{
		shows:
			"Two columns of ranks (1 = highest) with a line per company. Lines that jump up are companies whose gap comes mostly from low worker pay, like McDonald's (125th in CEO pay, 5th in ratio), Aptiv and Carnival; Etsy moves the other way.",
		interaction: "Hover a line to highlight it; the four example companies are labeled by default."
	}}
/>
