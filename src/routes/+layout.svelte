<script>
	import favicon from '#lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<style>
	/* Site-wide basics. Colors: red = CEO, blue = companies/workers. */
	:global(body) {
		margin: 0;
		background: #fff;
		color: #222;
		font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
	}

	:global(h1) {
		margin: 0 0 0.5rem;
		font-size: 2.5rem;
		line-height: 1.15;
	}

	:global(h2) {
		margin: 0 0 0.5rem;
		font-size: 1.6rem;
		line-height: 1.25;
	}

	:global(button) {
		padding: 0.2rem 0.7rem;
		border: 1px solid #bbb;
		border-radius: 999px;
		background: #fff;
		font: inherit;
		font-size: 0.85rem;
		cursor: pointer;
	}

	:global(button:hover) {
		background: #f3f3f3;
	}

	:global(svg text) {
		font-family: inherit;
	}
</style>
