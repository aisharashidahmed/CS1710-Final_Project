<script>
	import Placeholder from '#lib/Placeholder.svelte';

	// Novel view (Aisha's draft): search a company, show a receipt with red CEO lines, blue worker lines and the purple ratio.
	// data = every company (see parseRow in #lib/data.js for the fields).
	// Replace the placeholder below with the chart.
	let { data } = $props();
</script>

<Placeholder
	label="Your company's pay receipt"
	height={400}
	novel
	plan={{
		shows:
			"A store-style receipt for the chosen company: CEO pay vs. median worker pay, the time on Jan 1 when the CEO had already “earned” the worker's year, and the year the worker would have had to start working to match the CEO.",
		interaction: "Search for a company to print its receipt, then download or share it as an image for campaign material."
	}}
/>
